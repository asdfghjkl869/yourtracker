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
import { DEFAULT_STAGES, SUBJECTS } from '../data/cbseData';
import { getDaysRemaining } from './helpers';

/**
 * Parses raw chapter strings (e.g. "Ch 3: Pair of Linear Equations in Two Variables")
 * into clean, standard labels (e.g. "Chapter 3") and the topic name.
 */
export function parseChapterLabelAndTitle(fullName: string): {
  chapterLabel: string;
  cleanName: string;
  chapterNumber: number;
} {
  if (!fullName) {
    return { chapterLabel: 'Chapter 1', cleanName: 'General Practice', chapterNumber: 1 };
  }

  const trimmed = fullName.trim();
  const match = trimmed.match(/^(?:Ch(?:apter)?\.?\s*(\d+)|(\d+)\.)[\s:]*(.*)$/i);

  if (match) {
    const num = parseInt(match[1] || match[2], 10);
    const rest = (match[3] || '').trim();
    return {
      chapterLabel: `Chapter ${num}`,
      cleanName: rest || `Chapter ${num}`,
      chapterNumber: num
    };
  }

  return {
    chapterLabel: trimmed,
    cleanName: trimmed,
    chapterNumber: 0
  };
}

export interface SubjectUrgencyScore {
  subject: SubjectName;
  daysLeft: number;
  completionPercent: number;
  remainingPercent: number;
  unresolvedMistakes: number;
  incompleteHardChapters: number;
  totalScore: number;
}

/**
 * Evaluates subject priority based on CBSE exam dates, remaining syllabus,
 * difficulty tags, and logged student mistakes.
 */
export function calculateSubjectUrgency(profile: UserProfile): SubjectUrgencyScore[] {
  const scores: SubjectUrgencyScore[] = [];

  for (const sub of SUBJECTS) {
    const subData = profile.subjects[sub];
    if (!subData) continue;

    const stagesList = profile.customStages[sub] || DEFAULT_STAGES[sub] || [];
    const totalChapters = (subData.chapters || []).length;
    const stagesPerChapter = stagesList.length || 4;
    const totalPossibleStages = totalChapters * stagesPerChapter;

    let completedStages = 0;
    let inProgressStages = 0;
    let incompleteHardChapters = 0;

    for (const ch of subData.chapters || []) {
      const states = ch.stageStates || [];
      const chDone = states.filter(s => s === 2).length;
      const chInProg = states.filter(s => s === 1).length;

      completedStages += chDone;
      inProgressStages += chInProg;

      if (ch.difficulty === 'Hard' && chDone < stagesPerChapter) {
        incompleteHardChapters++;
      }
    }

    const completionPercent =
      totalPossibleStages > 0
        ? Math.min(100, Math.round(((completedStages + inProgressStages * 0.5) / totalPossibleStages) * 100))
        : 0;
    const remainingPercent = 100 - completionPercent;

    const daysLeft = getDaysRemaining(subData.examDate);

    // Unresolved mistakes logged for this subject
    const unresolvedMistakes = (profile.mistakes || []).filter(
      m => m.subject === sub && !m.resolved && !m.isResolved
    ).length;

    // --- Scoring Formula ---
    let totalScore = 10; // Base score

    // 1. Days until exam (closer exam = higher priority)
    if (daysLeft >= 0) {
      if (daysLeft <= 3) totalScore += 60; // Imminent exam (this week)
      else if (daysLeft <= 7) totalScore += 45;
      else if (daysLeft <= 14) totalScore += 30; // Next 2 weeks
      else if (daysLeft <= 30) totalScore += 18;
      else if (daysLeft <= 60) totalScore += 10;
      else totalScore += 5;
    } else {
      // Exam has already passed
      totalScore -= 20;
    }

    // 2. Remaining syllabus percentage (more syllabus remaining = higher priority)
    totalScore += Math.round((remainingPercent / 100) * 35);

    // 3. Unresolved logged mistakes (student weaknesses need direct attention)
    totalScore += Math.min(25, unresolvedMistakes * 6);

    // 4. Incomplete hard chapters
    totalScore += Math.min(20, incompleteHardChapters * 4);

    scores.push({
      subject: sub,
      daysLeft,
      completionPercent,
      remainingPercent,
      unresolvedMistakes,
      incompleteHardChapters,
      totalScore
    });
  }

  // Sort descending: subjects that urgently need work come first
  scores.sort((a, b) => b.totalScore - a.totalScore);
  return scores;
}

/**
 * Determines clean work type string for a chapter and stage.
 * Examples: "NCERT + Examples", "Revision", "Practice Questions", "Concepts & Notes", "PYQs & Question Bank"
 */
export function determineWorkType(
  chapter: Chapter,
  subject: SubjectName,
  profile: UserProfile,
  energyLevel: EnergyLevel,
  hasMistakes: boolean,
  targetStageName?: string
): string {
  // If chapter has active logged mistakes, prioritize resolving them
  if (hasMistakes) {
    return 'Mistakes Review';
  }

  // If user has Low Energy, favor revision or lightweight review
  if (energyLevel === 'Low') {
    return 'Revision';
  }

  const stage = (targetStageName || '').toLowerCase();

  if (stage.includes('ncert') || stage.includes('line by line') || stage.includes('solution') || stage.includes('prashnottar')) {
    return 'NCERT + Examples';
  }
  if (stage.includes('pyq') || stage.includes('sample') || stage.includes('board') || stage.includes('previous')) {
    return 'PYQs & Question Bank';
  }
  if (stage.includes('exemplar') || stage.includes('hots') || stage.includes('module') || stage.includes('numerical') || stage.includes('agarwal') || stage.includes('chand')) {
    return 'Practice Questions';
  }
  if (stage.includes('lecture') || stage.includes('shot') || stage.includes('theory') || stage.includes('concept') || stage.includes('reading') || stage.includes('saransh')) {
    return 'Concepts & Notes';
  }
  if (stage.includes('formula') || stage.includes('derivation')) {
    return 'Formula Sheet';
  }
  if (stage.includes('diagram')) {
    return 'Diagrams & Terms';
  }
  if (stage.includes('map')) {
    return 'Map Work & Dates';
  }

  // Fallback based on chapter completion
  const states = chapter.stageStates || [];
  const doneCount = states.filter(s => s === 2).length;
  if (doneCount >= states.length && states.length > 0) {
    return 'Revision';
  }
  if (doneCount === 0) {
    return subject === 'Mathematics' || subject === 'Physics' || subject === 'Chemistry'
      ? 'NCERT + Examples'
      : 'Concepts & Notes';
  }

  return 'Practice Questions';
}

/**
 * Finds the exact target stage for a chapter based on stage states and preset filters.
 */
export function getChapterStageDetails(
  chapter: Chapter,
  subject: SubjectName,
  profile: UserProfile,
  stageFocus: StageFocusCategory = 'all',
  selectedCustomStages: string[] = []
): { stageName: string; stageIndex: number; isCompleted: boolean } {
  const stages = profile.customStages[subject] || DEFAULT_STAGES[subject] || [];
  if (stages.length === 0) {
    return { stageName: 'NCERT Practice', stageIndex: 0, isCompleted: false };
  }

  const states = chapter.stageStates || [];

  // 1. Custom selected stages
  if (stageFocus === 'custom' && selectedCustomStages.length > 0) {
    const matched = stages
      .map((st, idx) => ({ name: st, idx }))
      .filter(item => selectedCustomStages.includes(item.name));

    if (matched.length > 0) {
      // In-progress first
      const inProg = matched.find(m => states[m.idx] === 1);
      if (inProg) return { stageName: inProg.name, stageIndex: inProg.idx, isCompleted: false };
      // Pending first
      const pending = matched.find(m => states[m.idx] === 0);
      if (pending) return { stageName: pending.name, stageIndex: pending.idx, isCompleted: false };
      // Fallback
      return { stageName: matched[0].name, stageIndex: matched[0].idx, isCompleted: true };
    }
  }

  // 2. In-Progress stages first (finish what has been started)
  for (let i = 0; i < stages.length; i++) {
    if (states[i] === 1) {
      return { stageName: stages[i], stageIndex: i, isCompleted: false };
    }
  }

  // 3. Earliest pending stage
  for (let i = 0; i < stages.length; i++) {
    if (states[i] === 0) {
      return { stageName: stages[i], stageIndex: i, isCompleted: false };
    }
  }

  // 4. If all done, pick last stage for revision
  const lastIdx = stages.length - 1;
  return { stageName: stages[lastIdx], stageIndex: lastIdx, isCompleted: true };
}

/**
 * Scores and ranks chapters within a specific subject.
 */
function rankChaptersForSubject(
  subject: SubjectName,
  profile: UserProfile,
  energyLevel: EnergyLevel
): Array<{
  chapter: Chapter;
  chapterIndex: number;
  hasMistakes: boolean;
  mistakesCount: number;
  score: number;
  reasonTag: string;
}> {
  const subData = profile.subjects[subject];
  if (!subData || !subData.chapters) return [];

  const chapters = subData.chapters;
  const stages = profile.customStages[subject] || DEFAULT_STAGES[subject] || [];
  const totalStages = stages.length || 4;

  const results = chapters.map((ch, idx) => {
    const states = ch.stageStates || [];
    const doneCount = states.filter(s => s === 2).length;
    const inProgCount = states.filter(s => s === 1).length;
    const isAllDone = totalStages > 0 && doneCount >= totalStages;
    const diff = ch.difficulty || 'Medium';

    const mistakes = (profile.mistakes || []).filter(
      m => m.subject === subject && m.chapterName.trim().toLowerCase() === ch.name.trim().toLowerCase() && !m.resolved && !m.isResolved
    );
    const mistakesCount = mistakes.length;
    const hasMistakes = mistakesCount > 0;

    let score = 20;
    let reasonTag = 'Regular Syllabus';

    // 1. Unresolved Mistakes (Direct student weakness)
    if (hasMistakes) {
      score += 40;
      reasonTag = `Mistakes Logged (${mistakesCount})`;
    }

    // 2. In-Progress Continuity (Do not abandon half-finished chapters)
    if (inProgCount > 0) {
      score += 30;
      if (!hasMistakes) reasonTag = 'In-Progress Chapter';
    }

    // 3. Difficulty weighting adapted to Energy Level
    if (energyLevel === 'High') {
      if (diff === 'Hard') {
        score += 28;
        if (!hasMistakes && inProgCount === 0) reasonTag = 'Hard Topic • Deep Focus';
      } else if (diff === 'Medium') {
        score += 14;
      } else {
        score += 6;
      }
    } else if (energyLevel === 'Medium') {
      if (diff === 'Medium') {
        score += 20;
      } else if (diff === 'Hard') {
        score += 18;
      } else {
        score += 10;
      }
    } else {
      // Low Energy: favor revision, easy/medium chapters, or chapters needing light brush-up
      if (diff === 'Easy') {
        score += 24;
        reasonTag = 'Light Focus';
      } else if (diff === 'Medium') {
        score += 18;
      } else {
        score += 4; // avoid heavy hard chapters on low energy
      }
      if (isAllDone) {
        score += 15; // revision friendly
      }
    }

    // 4. Completion Status
    if (isAllDone) {
      // Deprioritize fully finished chapters unless energy is Low or no unfinished chapters exist
      score -= energyLevel === 'Low' ? 10 : 35;
    } else if (doneCount === 0 && inProgCount === 0) {
      // Unstarted chapter: slight bonus
      score += 12;
      if (!hasMistakes && inProgCount === 0 && diff !== 'Hard') {
        reasonTag = 'Pending Chapter';
      }
    }

    // 5. Logical syllabus sequence: earlier chapters should generally be completed first
    const sequenceBonus = Math.max(0, 15 - idx);
    score += sequenceBonus;

    return {
      chapter: ch,
      chapterIndex: idx,
      hasMistakes,
      mistakesCount,
      score,
      reasonTag
    };
  });

  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Standard non-overlapping daily time slots designed for mental stamina and clean breaks.
 */
const TIME_SLOTS = [
  { start: '09:00', end: '09:45' },
  { start: '11:00', end: '11:45' },
  { start: '14:00', end: '14:45' },
  { start: '16:30', end: '17:15' },
  { start: '19:00', end: '19:45' },
  { start: '20:45', end: '21:30' }
];

/**
 * Rebuilt Auto Daily Plan Generator from scratch.
 * Generates 4-6 high-quality tasks per day with proper subject prioritization,
 * clean task naming ("Subject • Chapter • Type"), and energy level adaptation.
 */
export function generateDailyPlan(
  profile: UserProfile,
  energyLevel: EnergyLevel = 'Medium',
  diversityMode: PlanDiversityMode = 'balanced',
  focusSubject?: SubjectName,
  stageFocus: StageFocusCategory = 'all',
  selectedCustomStages: string[] = []
): DailyPlan {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Determine strict task count and default duration based on Energy Level
  // High = 6 tasks, Medium = 5 tasks, Low = 4 tasks (strictly within 4-6 range)
  let targetCount = 5;
  let defaultMinutes = 45;

  if (energyLevel === 'High') {
    targetCount = 6;
    defaultMinutes = 50;
  } else if (energyLevel === 'Low') {
    targetCount = 4;
    defaultMinutes = 35;
  }

  // 2. Rank subjects by urgency
  const subjectRankings = calculateSubjectUrgency(profile);

  // Filter or prioritize based on diversityMode
  let activeSubjects: SubjectUrgencyScore[] = subjectRankings;
  if (diversityMode === 'focus' && focusSubject) {
    const matched = subjectRankings.filter(s => s.subject === focusSubject);
    if (matched.length > 0) activeSubjects = matched;
  } else if (diversityMode === 'dual') {
    activeSubjects = subjectRankings.slice(0, 2);
  }

  // 3. Select chapters across subjects in a balanced, intelligent manner
  const selectedTasks: DailyTask[] = [];
  const subjectCounts = new Map<SubjectName, number>();
  const pickedChapterIds = new Set<string>();

  // Determine maximum tasks per subject to prevent one subject from dominating
  let maxPerSubject = 2;
  if (diversityMode === 'focus') {
    maxPerSubject = targetCount;
  } else if (diversityMode === 'dual') {
    maxPerSubject = Math.ceil(targetCount / 2);
  } else {
    // Balanced mode: spread across top 3-4 subjects
    maxPerSubject = targetCount <= 4 ? 2 : 2;
  }

  let pass = 0;
  while (selectedTasks.length < targetCount && pass < 4) {
    pass++;
    let addedInPass = 0;

    for (const subInfo of activeSubjects) {
      if (selectedTasks.length >= targetCount) break;

      const currentSubjectCount = subjectCounts.get(subInfo.subject) || 0;
      if (currentSubjectCount >= maxPerSubject) continue;

      const rankedChapters = rankChaptersForSubject(subInfo.subject, profile, energyLevel);

      // Find best candidate chapter not yet picked today
      const candidate = rankedChapters.find(c => !pickedChapterIds.has(c.chapter.id));

      if (candidate) {
        pickedChapterIds.add(candidate.chapter.id);
        subjectCounts.set(subInfo.subject, currentSubjectCount + 1);

        const stageDetails = getChapterStageDetails(
          candidate.chapter,
          subInfo.subject,
          profile,
          stageFocus,
          selectedCustomStages
        );

        const workType = determineWorkType(
          candidate.chapter,
          subInfo.subject,
          profile,
          energyLevel,
          candidate.hasMistakes,
          stageDetails.stageName
        );

        const { chapterLabel, cleanName } = parseChapterLabelAndTitle(candidate.chapter.name);

        // --- CLEAN TASK NAMING ---
        // Format: "Subject • Chapter X • Type of Work"
        // e.g. "Mathematics • Chapter 3 • NCERT + Examples"
        // e.g. "Physics • Chapter 1 • Revision"
        // e.g. "Chemistry • Chapter 5 • Practice Questions"
        const cleanTitle = `${subInfo.subject} • ${chapterLabel} • ${workType}`;

        // Duration calculation
        let duration = defaultMinutes;
        if (candidate.chapter.difficulty === 'Hard' && energyLevel === 'High') {
          duration = 55;
        } else if (workType === 'Revision' || energyLevel === 'Low') {
          duration = 30;
        }

        const slotIndex = selectedTasks.length % TIME_SLOTS.length;
        const slot = TIME_SLOTS[slotIndex];

        // Format a helpful, professional reason tag
        let reasonTag = candidate.reasonTag;
        if (subInfo.daysLeft >= 0 && subInfo.daysLeft <= 14) {
          reasonTag = `Exam in ${subInfo.daysLeft}d • ${subInfo.remainingPercent}% Left`;
        } else if (candidate.hasMistakes) {
          reasonTag = `Weak Area • ${candidate.mistakesCount} Mistakes`;
        }

        selectedTasks.push({
          id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          subject: subInfo.subject,
          chapterName: candidate.chapter.name,
          chapterId: candidate.chapter.id,
          title: cleanTitle,
          taskTitle: cleanTitle,
          stageName: stageDetails.stageName,
          stageIndex: stageDetails.stageIndex,
          workType,
          estimatedMinutes: duration,
          completed: false,
          isCompleted: false,
          priorityScore: candidate.score,
          reason: reasonTag,
          reasonTag,
          scheduledTime: slot.start
        });

        addedInPass++;
      }
    }

    if (addedInPass === 0) {
      // If we couldn't add any more tasks under the current limit, relax maxPerSubject
      maxPerSubject++;
    }
  }

  // 4. Fallback if profile had empty chapters
  if (selectedTasks.length < 4) {
    const fallbackSubjects: SubjectName[] = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
    while (selectedTasks.length < 4) {
      const idx = selectedTasks.length;
      const sub = fallbackSubjects[idx % fallbackSubjects.length];
      const slot = TIME_SLOTS[idx % TIME_SLOTS.length];
      const cleanTitle = `${sub} • Chapter 1 • NCERT + Examples`;

      selectedTasks.push({
        id: `task_fb_${Date.now()}_${idx}`,
        subject: sub,
        chapterName: 'Chapter 1: Foundational Practice',
        chapterId: `ch_fb_${idx}`,
        title: cleanTitle,
        taskTitle: cleanTitle,
        stageName: 'NCERT Practice',
        stageIndex: 0,
        workType: 'NCERT + Examples',
        estimatedMinutes: defaultMinutes,
        completed: false,
        isCompleted: false,
        priorityScore: 70,
        reason: 'CBSE Exam Preparation',
        reasonTag: 'Core Syllabus',
        scheduledTime: slot.start
      });
    }
  }

  const totalMinutes = selectedTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);

  return {
    date: todayStr,
    energyLevel,
    diversityMode,
    focusSubject: diversityMode === 'focus' ? focusSubject : undefined,
    stageFocus,
    selectedStages: selectedCustomStages,
    tasks: selectedTasks,
    generatedAt: new Date().toISOString(),
    targetTotalMinutes: totalMinutes,
    targetHours: Number((totalMinutes / 60).toFixed(1))
  };
}
