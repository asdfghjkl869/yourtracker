import {
  UserProfile,
  EnergyLevel,
  DailyTask,
  DailyPlan,
  SubjectName,
  PlanDiversityMode,
  Chapter
} from '../types';
import { getRankedChapters, RankedChapterItem, calculateChapterPriorityScore, getChapterMistakesCount } from './prioritizer';
import { DEFAULT_STAGES, SUBJECTS } from '../data/cbseData';
import { getDaysRemaining } from './helpers';

interface SubjectUrgencyInfo {
  subject: SubjectName;
  daysLeft: number;
  completionPercent: number;
  unresolvedMistakes: number;
  hardChaptersCount: number;
  subjectScore: number;
  candidates: RankedChapterItem[];
}

export function generateDailyPlan(
  profile: UserProfile,
  energyLevel: EnergyLevel = 'Medium',
  diversityMode: PlanDiversityMode = 'balanced',
  focusSubject?: SubjectName
): DailyPlan {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Target task count & duration based on energy
  let targetCount = 5;
  let defaultDuration = 40;

  if (energyLevel === 'Low') {
    targetCount = 3;
    defaultDuration = 25;
  } else if (energyLevel === 'High') {
    targetCount = 6;
    defaultDuration = 50;
  }

  // 2. Compute urgency & gather ranked chapters per subject
  const allRanked = getRankedChapters(profile);
  const subjectsUrgency: SubjectUrgencyInfo[] = [];

  for (const sub of SUBJECTS) {
    const subData = profile.subjects[sub];
    if (!subData) continue;

    const stagesList = profile.customStages[sub] || DEFAULT_STAGES[sub] || [];
    const totalPossibleStages = (subData.chapters || []).length * (stagesList.length || 4);
    let doneStagesCount = 0;
    let hardCount = 0;

    for (const ch of subData.chapters || []) {
      const doneForCh = (ch.stageStates || []).filter(s => s === 2).length;
      doneStagesCount += doneForCh;
      if (ch.difficulty === 'Hard' && doneForCh < (stagesList.length || 4)) {
        hardCount++;
      }
    }

    const completionPercent = totalPossibleStages > 0
      ? Math.round((doneStagesCount / totalPossibleStages) * 100)
      : 0;

    const daysLeft = getDaysRemaining(subData.examDate);

    // Unresolved mistakes in this subject
    const unresolvedMistakes = (profile.mistakes || []).filter(
      m => m.subject === sub && !m.resolved && !m.isResolved
    ).length;

    // Chapters for this subject sorted by priority
    let subChapters = allRanked.filter(item => item.subject === sub);

    // If Low energy: prioritize review, formulas, mistakes, or medium difficulty chapters over pure unstarted Hard ones
    if (energyLevel === 'Low') {
      subChapters = [...subChapters].sort((a, b) => {
        const aScore = (a.mistakesCount > 0 ? 35 : 0) + (a.percentDone > 40 ? 25 : 0);
        const bScore = (b.mistakesCount > 0 ? 35 : 0) + (b.percentDone > 40 ? 25 : 0);
        return bScore - aScore;
      });
    }

    // Calculate subject-level urgency score
    let subjectScore = 15;

    // Exam proximity factor
    if (daysLeft >= 0) {
      if (daysLeft <= 2) subjectScore += 55; // Exam in 48 hours!
      else if (daysLeft <= 7) subjectScore += 38;
      else if (daysLeft <= 14) subjectScore += 24;
      else if (daysLeft <= 30) subjectScore += 12;
      else subjectScore += 4;
    }

    // Lagging syllabus factor (lower completion = more urgent catch-up)
    subjectScore += Math.round((100 - completionPercent) * 0.35);

    // Mistakes bonus
    subjectScore += Math.min(25, unresolvedMistakes * 6);

    // Hard chapters factor
    subjectScore += Math.min(15, hardCount * 3);

    subjectsUrgency.push({
      subject: sub,
      daysLeft,
      completionPercent,
      unresolvedMistakes,
      hardChaptersCount: hardCount,
      subjectScore,
      candidates: subChapters
    });
  }

  // Sort subjects by urgency score descending
  subjectsUrgency.sort((a, b) => b.subjectScore - a.subjectScore);

  // 3. Determine subject limits according to diversity mode
  const selectedTasks: DailyTask[] = [];
  const subjectTaskCounts = new Map<SubjectName, number>();
  const isPanic = subjectsUrgency.some(s => s.daysLeft <= 2 && s.daysLeft >= 0);

  // Maximum allowed tasks per subject to guarantee MULTI-SUBJECT DIVERSITY
  let maxTasksPerSubject = 2;
  if (diversityMode === 'balanced') {
    if (targetCount <= 3) {
      maxTasksPerSubject = 1; // 3 tasks across 3 different subjects!
    } else if (targetCount <= 5) {
      maxTasksPerSubject = 2; // 4-5 tasks across at least 3 distinct subjects!
    } else {
      maxTasksPerSubject = 2; // 6 tasks across at least 3-4 distinct subjects!
    }
  } else if (diversityMode === 'dual') {
    maxTasksPerSubject = Math.ceil(targetCount / 2); // Split across 2 subjects
  } else if (diversityMode === 'focus') {
    maxTasksPerSubject = targetCount; // Single subject deep-dive
  }

  // Determine eligible subjects list based on diversityMode
  let eligibleSubjects = [...subjectsUrgency];
  if (diversityMode === 'focus' && focusSubject) {
    const matched = subjectsUrgency.filter(s => s.subject === focusSubject);
    if (matched.length > 0) {
      eligibleSubjects = matched;
    }
  } else if (diversityMode === 'dual') {
    eligibleSubjects = subjectsUrgency.slice(0, 2);
  }

  // Scheduled time slots across a balanced day
  const timeSlots = ['09:00', '11:15', '14:30', '16:45', '19:00', '20:30', '21:45'];

  // 4. Interleaved Round-Robin Multi-Subject Selection
  // We make multiple passes across eligible subjects so tasks rotate naturally
  // (e.g. Task 1: Math, Task 2: Science, Task 3: Social Science, Task 4: Math, Task 5: English)
  let loopSafety = 0;
  while (selectedTasks.length < targetCount && loopSafety < 50) {
    loopSafety++;
    let addedInThisPass = 0;

    for (const subInfo of eligibleSubjects) {
      if (selectedTasks.length >= targetCount) break;

      const currentCount = subjectTaskCounts.get(subInfo.subject) || 0;

      // In balanced mode, check max task limit for this subject
      // (Unless all subjects have hit their limit and we still need tasks)
      if (diversityMode === 'balanced' && currentCount >= maxTasksPerSubject) {
        continue;
      }
      if (diversityMode === 'dual' && currentCount >= maxTasksPerSubject) {
        continue;
      }

      // Find the next unpicked chapter from this subject
      const alreadyPickedChapterIds = new Set(
        selectedTasks.filter(t => t.subject === subInfo.subject).map(t => t.chapterId)
      );

      // Prefer chapters with incomplete stages or mistakes
      let nextCandidate = subInfo.candidates.find(
        c => !alreadyPickedChapterIds.has(c.chapter.id) && c.percentDone < 100
      );

      // If all chapters in this subject are 100% complete, pick one for revision/mock
      if (!nextCandidate) {
        nextCandidate = subInfo.candidates.find(
          c => !alreadyPickedChapterIds.has(c.chapter.id)
        );
      }

      if (nextCandidate) {
        const item = nextCandidate;
        const stages = profile.customStages[item.subject] || DEFAULT_STAGES[item.subject] || [];
        let pendingStageName = 'NCERT Problem Practice';
        for (let i = 0; i < stages.length; i++) {
          if ((item.chapter.stageStates || [])[i] !== 2) {
            pendingStageName = stages[i];
            break;
          }
        }

        let taskTitle = `${pendingStageName} — ${item.chapter.name}`;
        let reasonTag = item.reasons[0] || item.urgencyTag;

        if (item.mistakesCount > 0) {
          taskTitle = `Review ${item.mistakesCount} logged mistake${item.mistakesCount > 1 ? 's' : ''} & solve ${item.chapter.name}`;
          reasonTag = `⚠️ Weak Chapter (${item.mistakesCount} Mistakes)`;
        } else if (item.difficulty === 'Hard') {
          taskTitle = `Deep Work: ${pendingStageName} (${item.chapter.name})`;
          reasonTag = '🔥 Hard Difficulty';
        } else if (item.percentDone === 0) {
          taskTitle = `Foundation: ${pendingStageName} for ${item.chapter.name}`;
          reasonTag = '⚡ 0% Syllabus Coverage';
        } else if (item.percentDone === 100) {
          taskTitle = `Active Recall & PYQ Revision: ${item.chapter.name}`;
          reasonTag = '🔄 Retention & Sample Practice';
        }

        // Duration estimation
        let duration = defaultDuration;
        if (item.difficulty === 'Hard') duration += energyLevel === 'High' ? 15 : 5;
        if (energyLevel === 'Low') duration = Math.min(30, duration);

        const slotIndex = selectedTasks.length % timeSlots.length;
        const scheduledTime = timeSlots[slotIndex];

        selectedTasks.push({
          id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          subject: item.subject,
          chapterName: item.chapter.name,
          chapterId: item.chapter.id,
          title: taskTitle,
          taskTitle,
          stageName: pendingStageName,
          estimatedMinutes: duration,
          completed: false,
          isCompleted: false,
          priorityScore: item.priorityScore,
          reason: reasonTag,
          reasonTag,
          scheduledTime
        });

        subjectTaskCounts.set(subInfo.subject, currentCount + 1);
        addedInThisPass++;
      }
    }

    // If no tasks could be added in this pass due to maxTasksPerSubject, loosen the constraint by +1
    if (addedInThisPass === 0) {
      maxTasksPerSubject++;
    }
  }

  // 5. Fallback safety if no tasks could be formed (e.g. empty profile or complete syllabus)
  if (selectedTasks.length === 0) {
    const fallbackSubjects: SubjectName[] = ['Mathematics', 'Physics', 'Chemistry', 'Social Science', 'English'];
    for (let i = 0; i < Math.min(targetCount, fallbackSubjects.length); i++) {
      const sub = fallbackSubjects[i];
      selectedTasks.push({
        id: 'task_' + Date.now() + '_' + i,
        subject: sub,
        chapterName: 'Full Syllabus Board Revision',
        chapterId: 'fallback_' + i,
        title: `CBSE Sample Paper & PYQ Practice for ${sub}`,
        taskTitle: `CBSE Sample Paper & PYQ Practice for ${sub}`,
        stageName: 'Sample Papers',
        estimatedMinutes: defaultDuration,
        completed: false,
        isCompleted: false,
        priorityScore: 70,
        reason: 'Board Exam Preparation',
        reasonTag: 'Full Syllabus Mock',
        scheduledTime: timeSlots[i] || '10:00'
      });
    }
  }

  const totalMins = selectedTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);

  return {
    date: todayStr,
    energyLevel,
    diversityMode,
    focusSubject: diversityMode === 'focus' ? focusSubject : undefined,
    tasks: selectedTasks,
    generatedAt: new Date().toISOString(),
    targetTotalMinutes: totalMins,
    targetHours: Number((totalMins / 60).toFixed(1))
  };
}
