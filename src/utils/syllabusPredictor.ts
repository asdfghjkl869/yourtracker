import { UserProfile, SubjectName } from '../types';
import { SUBJECTS, DEFAULT_STAGES, getDefaultDatesheet } from '../data/cbseData';
import { getDaysRemaining, formatDateIndian } from './helpers';

export interface SubjectPrediction {
  subject: SubjectName;
  examDate: string;
  daysLeft: number;
  totalStages: number;
  completedStages: number;
  remainingStages: number;
  percent: number;
  dailyVelocityStages: number;
  predictedCompletionDateStr: string;
  daysDiffWithExam: number; // positive = buffer before exam (good), negative = delayed after exam
  status: 'on-track' | 'tight' | 'behind';
  recommendation: string;
}

export interface GlobalSyllabusPrediction {
  totalChapters: number;
  totalStages: number;
  completedStages: number;
  remainingStages: number;
  overallPercent: number;
  dailyVelocityStages: number;
  predictedCompletionDateStr: string;
  status: 'on-track' | 'tight' | 'behind';
  daysLeftToNearestExam: number;
  nearestExamSubject: SubjectName;
  subjectPredictions: Record<SubjectName, SubjectPrediction>;
}

export function calculateSyllabusPrediction(profile: UserProfile): GlobalSyllabusPrediction {
  const now = new Date();
  const defaultDates = getDefaultDatesheet();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 1. Calculate actual recent study velocity (last 7-14 days)
  const recentSessions = (profile.sessions || []).filter(
    s => new Date(s.timestamp || s.date) >= fourteenDaysAgo
  );
  const sessionHours = recentSessions.reduce((acc, s) => acc + (s.durationMinutes || 0) / 60, 0);

  // Include completed calendar blocks in the velocity calculation
  const recentCompletedBlocks = (profile.calendarBlocks || []).filter(b => {
    if (!b.isCompleted) return false;
    const bDate = new Date(b.date);
    return bDate >= fourteenDaysAgo && bDate <= now;
  });
  const blockHours = recentCompletedBlocks.reduce((acc, b) => {
    const [sh, sm] = b.startTime.split(':').map(Number);
    const [eh, em] = b.endTime.split(':').map(Number);
    const dur = (eh * 60 + em) - (sh * 60 + sm);
    return acc + (dur > 0 ? dur : 60) / 60;
  }, 0);

  const totalRecentStudyHours = sessionHours + blockHours;
  const uniqueActiveDays = new Set([
    ...recentSessions.map(s => (s.timestamp || s.date || '').split('T')[0]),
    ...recentCompletedBlocks.map(b => b.date)
  ]).size;

  // Baseline daily stages based on energy level for CBSE board exams sprint (Class 10/12)
  const energy = profile.energyLevel || 'Medium';
  const baselineRateByEnergy = energy === 'High' ? 5.8 : energy === 'Low' ? 3.4 : 4.6;

  let estimatedDailyStages = baselineRateByEnergy;
  if (totalRecentStudyHours > 0) {
    const activeDays = Math.max(uniqueActiveDays, 3);
    const avgDailyHours = totalRecentStudyHours / activeDays;
    // In an intensive board sprint, ~45-50 mins (0.8h) focused work covers 1 syllabus stage/revision unit
    const sessionVelocity = avgDailyHours / 0.8;
    // Blend observed velocity (65%) with baseline energy pacing (35%)
    estimatedDailyStages = Math.max(3.2, Math.round((sessionVelocity * 0.65 + baselineRateByEnergy * 0.35) * 10) / 10);
  }

  let globalTotalChapters = 0;
  let globalTotalStages = 0;
  let globalCompletedStages = 0;

  const subjectPredictions = {} as Record<SubjectName, SubjectPrediction>;
  let nearestExamSubject: SubjectName = 'Mathematics';
  let minDaysLeft = 999;

  // 2. Identify nearest exam date & subject stats
  SUBJECTS.forEach(sub => {
    const subData = profile.subjects[sub];
    const examDate = subData?.examDate || defaultDates[sub] || '2026-10-15';
    const daysLeft = getDaysRemaining(examDate);

    if (daysLeft >= 0 && daysLeft < minDaysLeft) {
      minDaysLeft = daysLeft;
      nearestExamSubject = sub;
    }
  });

  if (minDaysLeft === 999) {
    minDaysLeft = 38; // Default to mid-October 2026
    nearestExamSubject = 'Mathematics';
  }

  // 3. Process each subject
  SUBJECTS.forEach(sub => {
    const subData = profile.subjects[sub];
    const stages = profile.customStages[sub] || DEFAULT_STAGES[sub] || [];
    const chapters = subData?.chapters || [];
    const examDate = subData?.examDate || defaultDates[sub] || '2026-10-15';
    const daysLeft = getDaysRemaining(examDate);

    const totalSubStages = chapters.length * stages.length;
    let completedSubUnits = 0;

    chapters.forEach(ch => {
      const states = ch.stageStates || [];
      states.slice(0, stages.length).forEach(st => {
        if (st === 2) {
          completedSubUnits += 1;
        } else if (st === 1) {
          // Half-credit for in-progress stages so progress is never stuck at 0%
          completedSubUnits += 0.5;
        }
      });
    });

    const completedSubStages = Math.round(completedSubUnits);
    const remainingSubStages = Math.max(0, totalSubStages - completedSubStages);
    const percent = totalSubStages > 0 ? Math.round((completedSubUnits / totalSubStages) * 100) : 0;

    // Weight allocation for this subject: Math & Science get slightly higher daily focus
    const subWeight = sub === 'Mathematics' || sub === 'Physics' || sub === 'Chemistry' ? 1.2 : 0.9;
    const subDailyRate = Math.max(0.5, Math.round(((estimatedDailyStages / 7) * subWeight) * 10) / 10);

    // Subject completion prediction:
    // If behind, cap projection to around or slightly after the subject exam date (within 3-7 days max)
    const rawSubDaysNeeded = subDailyRate > 0 ? Math.ceil(remainingSubStages / subDailyRate) : 30;
    const targetSprintDays = Math.max(1, daysLeft);

    let effectiveSubDaysNeeded = rawSubDaysNeeded;
    if (rawSubDaysNeeded > targetSprintDays) {
      // Lagging: project around exam date (not months later)
      effectiveSubDaysNeeded = Math.min(targetSprintDays + 6, rawSubDaysNeeded);
    }

    const predictedDate = new Date(now.getTime() + effectiveSubDaysNeeded * 24 * 60 * 60 * 1000);
    const predictedCompletionDateStr = formatDateIndian(predictedDate.toISOString().split('T')[0]);
    const daysDiffWithExam = daysLeft - rawSubDaysNeeded;

    let status: 'on-track' | 'tight' | 'behind' = 'on-track';
    let recommendation = 'Pace is ideal! Maintain consistency.';

    if (remainingSubStages === 0) {
      status = 'on-track';
      recommendation = 'Syllabus 100% complete! Focus on PYQs and sample papers.';
    } else if (daysDiffWithExam >= 6) {
      status = 'on-track';
      recommendation = `On schedule with ${daysDiffWithExam} days buffer for full revision.`;
    } else if (daysDiffWithExam >= 0) {
      status = 'tight';
      recommendation = `Tight margin (${daysDiffWithExam}d buffer). Aim to add +30m study daily.`;
    } else {
      status = 'behind';
      const shortage = Math.abs(daysDiffWithExam);
      const reqPace = (remainingSubStages / Math.max(1, daysLeft)).toFixed(1);
      recommendation = `Lagging by ~${shortage} days. Increase pace to ${reqPace} stages/day to finish before exam.`;
    }

    subjectPredictions[sub] = {
      subject: sub,
      examDate,
      daysLeft,
      totalStages: totalSubStages,
      completedStages: completedSubStages,
      remainingStages: remainingSubStages,
      percent,
      dailyVelocityStages: subDailyRate,
      predictedCompletionDateStr,
      daysDiffWithExam,
      status,
      recommendation
    };

    globalTotalChapters += chapters.length;
    globalTotalStages += totalSubStages;
    globalCompletedStages += completedSubUnits;
  });

  const roundedGlobalCompleted = Math.round(globalCompletedStages);
  const globalRemainingStages = Math.max(0, globalTotalStages - roundedGlobalCompleted);
  const globalPercent = globalTotalStages > 0 ? Math.round((globalCompletedStages / globalTotalStages) * 100) : 0;

  // 4. Global Projected Full Completion Date:
  // For mid-October 2026 board exams, calculate realistic sprint completion
  const rawGlobalDaysNeeded = Math.ceil(globalRemainingStages / Math.max(1.0, estimatedDailyStages));
  const examSprintWindow = Math.max(1, minDaysLeft);

  // If user is behind, project realistic date around or slightly after first exam (e.g. within 5-10 days), never months away
  let effectiveGlobalDaysNeeded = rawGlobalDaysNeeded;
  if (rawGlobalDaysNeeded > examSprintWindow) {
    const delay = Math.min(8, Math.ceil((rawGlobalDaysNeeded - examSprintWindow) * 0.25));
    effectiveGlobalDaysNeeded = examSprintWindow + delay;
  } else {
    effectiveGlobalDaysNeeded = Math.max(3, rawGlobalDaysNeeded);
  }

  const globalPredictedDate = new Date(now.getTime() + effectiveGlobalDaysNeeded * 24 * 60 * 60 * 1000);
  const globalDateStr = formatDateIndian(globalPredictedDate.toISOString().split('T')[0]);

  // Overall status based on nearest board exam
  let globalStatus: 'on-track' | 'tight' | 'behind' = 'on-track';
  const nearestDiff = minDaysLeft - rawGlobalDaysNeeded;
  if (nearestDiff >= 6) {
    globalStatus = 'on-track';
  } else if (nearestDiff >= 0) {
    globalStatus = 'tight';
  } else {
    globalStatus = 'behind';
  }

  return {
    totalChapters: globalTotalChapters,
    totalStages: globalTotalStages,
    completedStages: roundedGlobalCompleted,
    remainingStages: globalRemainingStages,
    overallPercent: globalPercent,
    dailyVelocityStages: estimatedDailyStages,
    predictedCompletionDateStr: globalDateStr,
    status: globalStatus,
    daysLeftToNearestExam: minDaysLeft,
    nearestExamSubject,
    subjectPredictions
  };
}
