import { UserProfile, EnergyLevel, DailyTask, DailyPlan, SubjectName } from '../types';
import { getRankedChapters } from './prioritizer';
import { DEFAULT_STAGES } from '../data/cbseData';

export function generateDailyPlan(profile: UserProfile, energyLevel: EnergyLevel = 'Medium'): DailyPlan {
  const todayStr = new Date().toISOString().split('T')[0];
  const rankedChapters = getRankedChapters(profile);

  // Target task count & duration based on energy
  let targetCount = 5;
  let defaultDuration = 40;

  if (energyLevel === 'Low') {
    targetCount = 3;
    defaultDuration = 25;
  } else if (energyLevel === 'High') {
    targetCount = 6;
    defaultDuration = 50;
  }

  // Filter candidates based on energy level
  // If Low energy: prefer revision, formulas, medium/easy chapters, or unresolved mistakes review
  // If High energy: pick highest priority Hard chapters and numericals
  let candidates = [...rankedChapters];
  if (energyLevel === 'Low') {
    candidates = candidates.sort((a, b) => {
      // Prioritize chapters with mistakes or revision over purely unstarted Hard monsters
      const aScore = (a.mistakesCount > 0 ? 30 : 0) + (a.percentDone > 50 ? 20 : 0);
      const bScore = (b.mistakesCount > 0 ? 30 : 0) + (b.percentDone > 50 ? 20 : 0);
      return bScore - aScore;
    });
  }

  const selectedTasks: DailyTask[] = [];
  const usedSubjects = new Set<SubjectName>();

  // Slot tasks ensuring a good subject variety if possible
  for (const item of candidates) {
    if (selectedTasks.length >= targetCount) break;

    // Determine specific task title based on pending stages and mistakes
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
      taskTitle = `Review ${item.mistakesCount} logged mistakes & solve ${item.chapter.name} NCERT`;
      reasonTag = `⚠️ Weak Chapter (${item.mistakesCount} Mistakes)`;
    } else if (item.difficulty === 'Hard') {
      taskTitle = `Deep Work: ${pendingStageName} (${item.chapter.name})`;
      reasonTag = '🔥 Hard Difficulty Focus';
    } else if (item.percentDone === 0) {
      taskTitle = `Foundation: ${pendingStageName} for ${item.chapter.name}`;
      reasonTag = '⚡ 0% Coverage (Unstarted)';
    }

    // Determine estimated duration based on energy and chapter difficulty
    let duration = defaultDuration;
    if (item.difficulty === 'Hard') duration += energyLevel === 'High' ? 15 : 5;
    if (energyLevel === 'Low') duration = Math.min(30, duration);

    // Initial default scheduled time suggestions (starting 09:00, spaced out)
    const baseHour = 9 + selectedTasks.length * 2;
    const hourStr = String(Math.min(21, baseHour)).padStart(2, '0');
    const scheduledTime = `${hourStr}:00`;

    selectedTasks.push({
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      subject: item.subject,
      chapterName: item.chapter.name,
      chapterId: item.chapter.id,
      taskTitle,
      stageName: pendingStageName,
      estimatedMinutes: duration,
      completed: false,
      priorityScore: item.priorityScore,
      reasonTag,
      scheduledTime
    });

    usedSubjects.add(item.subject);
  }

  // Fallback if no tasks were generated (e.g. all 100% complete)
  if (selectedTasks.length === 0) {
    selectedTasks.push({
      id: 'task_' + Date.now(),
      subject: 'Mathematics',
      chapterName: 'Sample Papers & Mock Revision',
      taskTitle: 'Solve 1 CBSE Board Sample Paper with Timer',
      stageName: 'Sample Papers',
      estimatedMinutes: 60,
      completed: false,
      priorityScore: 70,
      reasonTag: 'Full Syllabus Mock',
      scheduledTime: '10:00'
    });
  }

  const totalMins = selectedTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);

  return {
    date: todayStr,
    energyLevel,
    tasks: selectedTasks,
    generatedAt: new Date().toISOString(),
    targetTotalMinutes: totalMins
  };
}
