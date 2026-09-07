import {
  UserProfile,
  EnergyLevel,
  DailyTask,
  DailyPlan,
  SubjectName,
  PlanDiversityMode,
  StageFocusCategory,
  Chapter
} from '../types';
import { getRankedChapters, RankedChapterItem } from './prioritizer';
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

export interface TargetStageResult {
  stageName: string;
  stageIndex: number;
  isMatch: boolean;
  stageState: number; // 0: Pending, 1: In Progress, 2: Done
}

/**
 * Finds the most relevant stage for a given chapter based on stage focus or custom selected stages.
 */
export function findTargetStageForChapter(
  chapter: Chapter,
  subject: SubjectName,
  profile: UserProfile,
  stageFocus: StageFocusCategory = 'all',
  selectedCustomStages: string[] = []
): TargetStageResult {
  const stages = profile.customStages[subject] || DEFAULT_STAGES[subject] || [];
  if (stages.length === 0) {
    return { stageName: 'NCERT Practice', stageIndex: 0, isMatch: true, stageState: 0 };
  }

  const states = chapter.stageStates || [];

  const matchesKeyword = (name: string, keywords: string[]) => {
    const lower = name.toLowerCase();
    return keywords.some(k => lower.includes(k));
  };

  // 1. Custom selected stages
  if (stageFocus === 'custom' && selectedCustomStages.length > 0) {
    const matchedIndices: number[] = [];
    stages.forEach((st, idx) => {
      if (selectedCustomStages.includes(st)) {
        matchedIndices.push(idx);
      }
    });

    if (matchedIndices.length > 0) {
      // Prioritize In Progress (1)
      const inProg = matchedIndices.find(idx => states[idx] === 1);
      if (inProg !== undefined) {
        return { stageName: stages[inProg], stageIndex: inProg, isMatch: true, stageState: 1 };
      }
      // Then Pending (0)
      const pending = matchedIndices.find(idx => states[idx] === 0);
      if (pending !== undefined) {
        return { stageName: stages[pending], stageIndex: pending, isMatch: true, stageState: 0 };
      }
      // If all chosen stages are done (2), schedule first chosen for revision
      const firstChosen = matchedIndices[0];
      return {
        stageName: stages[firstChosen],
        stageIndex: firstChosen,
        isMatch: true,
        stageState: states[firstChosen] ?? 2
      };
    }
  }

  // 2. In-Progress only
  if (stageFocus === 'in_progress') {
    for (let i = 0; i < stages.length; i++) {
      if (states[i] === 1) {
        return { stageName: stages[i], stageIndex: i, isMatch: true, stageState: 1 };
      }
    }
  }

  // 3. Theory / Concepts (Lectures, One Shot, Theory, Notes, Reading)
  if (stageFocus === 'theory') {
    for (let i = 0; i < stages.length; i++) {
      if (matchesKeyword(stages[i], ['lecture', 'shot', 'theory', 'reading', 'saransh', 'formula', 'notes', 'concept'])) {
        return { stageName: stages[i], stageIndex: i, isMatch: true, stageState: states[i] ?? 0 };
      }
    }
    return { stageName: stages[0], stageIndex: 0, isMatch: true, stageState: states[0] ?? 0 };
  }

  // 4. NCERT / Standard Questions
  if (stageFocus === 'ncert') {
    for (let i = 0; i < stages.length; i++) {
      if (matchesKeyword(stages[i], ['ncert', 'line by line', 'solutions', 'prashnottar', 'back questions'])) {
        return { stageName: stages[i], stageIndex: i, isMatch: true, stageState: states[i] ?? 0 };
      }
    }
    const idx = Math.min(1, stages.length - 1);
    return { stageName: stages[idx], stageIndex: idx, isMatch: true, stageState: states[idx] ?? 0 };
  }

  // 5. Advanced / Modules / Exemplar / HOTS
  if (stageFocus === 'advanced') {
    for (let i = 0; i < stages.length; i++) {
      if (matchesKeyword(stages[i], ['module', 'exemplar', 'hots', 'agarwal', 'chand', 'numericals', 'map work', 'shabdarth'])) {
        return { stageName: stages[i], stageIndex: i, isMatch: true, stageState: states[i] ?? 0 };
      }
    }
    const idx = Math.min(2, stages.length - 1);
    return { stageName: stages[idx], stageIndex: idx, isMatch: true, stageState: states[idx] ?? 0 };
  }

  // 6. PYQ / Mock / Practice / Revision
  if (stageFocus === 'practice') {
    for (let i = stages.length - 1; i >= 0; i--) {
      if (matchesKeyword(stages[i], ['pyq', 'sample', 'paper', 'practice', 'test', 'patra', 'previous'])) {
        return { stageName: stages[i], stageIndex: i, isMatch: true, stageState: states[i] ?? 0 };
      }
    }
    const idx = stages.length - 1;
    return { stageName: stages[idx], stageIndex: idx, isMatch: true, stageState: states[idx] ?? 0 };
  }

  // 7. Default ('all'): First finish what's In Progress (1)
  for (let i = 0; i < stages.length; i++) {
    if (states[i] === 1) {
      return { stageName: stages[i], stageIndex: i, isMatch: true, stageState: 1 };
    }
  }

  // Then earliest pending stage (0)
  for (let i = 0; i < stages.length; i++) {
    if (states[i] === 0) {
      return { stageName: stages[i], stageIndex: i, isMatch: true, stageState: 0 };
    }
  }

  // If all completed (2), return the last stage (PYQ/Practice) for revision
  const lastIdx = stages.length - 1;
  return { stageName: stages[lastIdx], stageIndex: lastIdx, isMatch: false, stageState: 2 };
}

export function generateDailyPlan(
  profile: UserProfile,
  energyLevel: EnergyLevel = 'Medium',
  diversityMode: PlanDiversityMode = 'balanced',
  focusSubject?: SubjectName,
  stageFocus: StageFocusCategory = 'all',
  selectedCustomStages: string[] = []
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

    // If stage focus is active, re-rank chapters that have matching pending stages
    if (stageFocus !== 'all') {
      subChapters = [...subChapters].sort((a, b) => {
        const aTarget = findTargetStageForChapter(a.chapter, sub, profile, stageFocus, selectedCustomStages);
        const bTarget = findTargetStageForChapter(b.chapter, sub, profile, stageFocus, selectedCustomStages);
        const aScore = (aTarget.isMatch && aTarget.stageState !== 2 ? 60 : 0) + (a.mistakesCount > 0 ? 20 : 0) + a.priorityScore;
        const bScore = (bTarget.isMatch && bTarget.stageState !== 2 ? 60 : 0) + (b.mistakesCount > 0 ? 20 : 0) + b.priorityScore;
        return bScore - aScore;
      });
    } else if (energyLevel === 'Low') {
      // If Low energy: prioritize review, formulas, mistakes, or medium difficulty chapters
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
      if (daysLeft <= 2) subjectScore += 55;
      else if (daysLeft <= 7) subjectScore += 38;
      else if (daysLeft <= 14) subjectScore += 24;
      else if (daysLeft <= 30) subjectScore += 12;
      else subjectScore += 4;
    }

    // Lagging syllabus factor
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

  let maxTasksPerSubject = 2;
  if (diversityMode === 'balanced') {
    if (targetCount <= 3) {
      maxTasksPerSubject = 1;
    } else if (targetCount <= 5) {
      maxTasksPerSubject = 2;
    } else {
      maxTasksPerSubject = 2;
    }
  } else if (diversityMode === 'dual') {
    maxTasksPerSubject = Math.ceil(targetCount / 2);
  } else if (diversityMode === 'focus') {
    maxTasksPerSubject = targetCount;
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

  // 4. Interleaved Round-Robin Selection
  let loopSafety = 0;
  while (selectedTasks.length < targetCount && loopSafety < 50) {
    loopSafety++;
    let addedInThisPass = 0;

    for (const subInfo of eligibleSubjects) {
      if (selectedTasks.length >= targetCount) break;

      const currentCount = subjectTaskCounts.get(subInfo.subject) || 0;

      if (diversityMode === 'balanced' && currentCount >= maxTasksPerSubject) {
        continue;
      }
      if (diversityMode === 'dual' && currentCount >= maxTasksPerSubject) {
        continue;
      }

      const alreadyPickedChapterIds = new Set(
        selectedTasks.filter(t => t.subject === subInfo.subject).map(t => t.chapterId)
      );

      // 1st Preference: chapters matching the chosen stage focus and not yet completed
      let nextCandidate = subInfo.candidates.find(c => {
        if (alreadyPickedChapterIds.has(c.chapter.id)) return false;
        if (stageFocus !== 'all') {
          const target = findTargetStageForChapter(c.chapter, subInfo.subject, profile, stageFocus, selectedCustomStages);
          return target.isMatch && target.stageState !== 2;
        }
        return c.percentDone < 100;
      });

      // 2nd Preference: any unpicked incomplete chapter
      if (!nextCandidate) {
        nextCandidate = subInfo.candidates.find(
          c => !alreadyPickedChapterIds.has(c.chapter.id) && c.percentDone < 100
        );
      }

      // 3rd Preference: unpicked chapter even if 100% (for active recall / practice)
      if (!nextCandidate) {
        nextCandidate = subInfo.candidates.find(
          c => !alreadyPickedChapterIds.has(c.chapter.id)
        );
      }

      if (nextCandidate) {
        const item = nextCandidate;
        const targetStage = findTargetStageForChapter(
          item.chapter,
          item.subject,
          profile,
          stageFocus,
          selectedCustomStages
        );

        const pendingStageName = targetStage.stageName;
        const targetStageIndex = targetStage.stageIndex;

        let taskTitle = `${pendingStageName} — ${item.chapter.name}`;
        let reasonTag = item.reasons[0] || item.urgencyTag;

        if (targetStage.stageState === 1) {
          taskTitle = `Resume: ${pendingStageName} (${item.chapter.name})`;
          reasonTag = '⏳ In Progress Stage';
        } else if (item.mistakesCount > 0) {
          taskTitle = `${pendingStageName} & Mistakes Review (${item.chapter.name})`;
          reasonTag = `⚠️ Weak Chapter (${item.mistakesCount} Mistakes)`;
        } else if (item.difficulty === 'Hard') {
          taskTitle = `Deep Work: ${pendingStageName} (${item.chapter.name})`;
          reasonTag = '🔥 Hard Difficulty';
        } else if (item.percentDone === 0) {
          taskTitle = `Start: ${pendingStageName} for ${item.chapter.name}`;
          reasonTag = '⚡ 0% Syllabus Coverage';
        } else if (item.percentDone === 100 || targetStage.stageState === 2) {
          taskTitle = `Active Recall: ${pendingStageName} (${item.chapter.name})`;
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
          stageIndex: targetStageIndex,
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

    if (addedInThisPass === 0) {
      maxTasksPerSubject++;
    }
  }

  // 5. Fallback safety if no tasks could be formed
  if (selectedTasks.length === 0) {
    const fallbackSubjects: SubjectName[] = ['Mathematics', 'Physics', 'Chemistry', 'Social Science', 'English'];
    for (let i = 0; i < Math.min(targetCount, fallbackSubjects.length); i++) {
      const sub = fallbackSubjects[i];
      const stages = profile.customStages[sub] || DEFAULT_STAGES[sub] || [];
      const fallbackStage = stages[Math.min(1, stages.length - 1)] || 'Sample Papers';
      selectedTasks.push({
        id: 'task_' + Date.now() + '_' + i,
        subject: sub,
        chapterName: 'Full Syllabus Board Revision',
        chapterId: 'fallback_' + i,
        title: `${fallbackStage} — CBSE Practice for ${sub}`,
        taskTitle: `${fallbackStage} — CBSE Practice for ${sub}`,
        stageName: fallbackStage,
        stageIndex: 0,
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
    stageFocus,
    selectedStages: selectedCustomStages,
    tasks: selectedTasks,
    generatedAt: new Date().toISOString(),
    targetTotalMinutes: totalMins,
    targetHours: Number((totalMins / 60).toFixed(1))
  };
}
