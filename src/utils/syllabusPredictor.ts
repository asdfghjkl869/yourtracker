import { UserProfile, SubjectName } from '../types';
import { SUBJECTS, DEFAULT_STAGES } from '../data/cbseData';
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
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 1. Calculate actual recent velocity from sessions & stages
  const recentSessions = (profile.sessions || []).filter(
    s => new Date(s.timestamp) >= fourteenDaysAgo
  );
  const totalRecentHours = recentSessions.reduce((acc, s) => acc + (s.durationMinutes || 0) / 60, 0);

  // Approximate that 1.25 hours of focused study completes 1 stage
  const stagesFromHours = totalRecentHours > 0 ? totalRecentHours / 1.25 : 0;
  
  // Daily rate over 14 days (with a floor of 1.2 stages/day so fresh accounts have a reasonable baseline prediction)
  const estimatedDailyStages = Math.max(1.2, Math.round((stagesFromHours / 14) * 10) / 10);

  let globalTotalChapters = 0;
  let globalTotalStages = 0;
  let globalCompletedStages = 0;

  const subjectPredictions = {} as Record<SubjectName, SubjectPrediction>;
  let nearestExamSubject: SubjectName = 'Mathematics';
  let minDaysLeft = 999;

  SUBJECTS.forEach(sub => {
    const subData = profile.subjects[sub];
    const stages = profile.customStages[sub] || DEFAULT_STAGES[sub] || [];
    const chapters = subData?.chapters || [];
    const daysLeft = getDaysRemaining(subData?.examDate || '');

    if (daysLeft >= 0 && daysLeft < minDaysLeft) {
      minDaysLeft = daysLeft;
      nearestExamSubject = sub;
    }

    const totalSubStages = chapters.length * stages.length;
    let completedSubStages = 0;

    chapters.forEach(ch => {
      const states = ch.stageStates || [];
      states.slice(0, stages.length).forEach(st => {
        if (st === 2) completedSubStages++;
      });
    });

    const remainingSubStages = Math.max(0, totalSubStages - completedSubStages);
    const percent = totalSubStages > 0 ? Math.round((completedSubStages / totalSubStages) * 100) : 0;

    // Allocate velocity proportionally to this subject (out of 7 subjects)
    const subDailyRate = Math.max(0.3, Math.round((estimatedDailyStages / 3.5) * 10) / 10);
    const daysNeeded = subDailyRate > 0 ? Math.ceil(remainingSubStages / subDailyRate) : 90;

    const predictedDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
    const predictedCompletionDateStr = formatDateIndian(predictedDate.toISOString().split('T')[0]);

    // Difference between exam day and predicted completion
    const daysDiffWithExam = daysLeft - daysNeeded;

    let status: 'on-track' | 'tight' | 'behind' = 'on-track';
    let recommendation = 'Pace is ideal! Maintain consistency.';

    if (remainingSubStages === 0) {
      status = 'on-track';
      recommendation = 'Syllabus 100% complete! Focus on PYQ sample papers.';
    } else if (daysDiffWithExam >= 7) {
      status = 'on-track';
      recommendation = `On schedule with ${daysDiffWithExam} days buffer for full revision.`;
    } else if (daysDiffWithExam >= 0) {
      status = 'tight';
      recommendation = `Tight margin (${daysDiffWithExam}d buffer). Aim to add +30m study daily.`;
    } else {
      status = 'behind';
      const shortage = Math.abs(daysDiffWithExam);
      recommendation = `Lagging by ~${shortage} days. Increase pace to ${(
        remainingSubStages / Math.max(1, daysLeft)
      ).toFixed(1)} stages/day.`;
    }

    subjectPredictions[sub] = {
      subject: sub,
      examDate: subData?.examDate || '',
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
    globalCompletedStages += completedSubStages;
  });

  const globalRemainingStages = Math.max(0, globalTotalStages - globalCompletedStages);
  const globalPercent = globalTotalStages > 0 ? Math.round((globalCompletedStages / globalTotalStages) * 100) : 0;
  const globalDaysNeeded = Math.ceil(globalRemainingStages / estimatedDailyStages);
  const globalPredictedDate = new Date(now.getTime() + globalDaysNeeded * 24 * 60 * 60 * 1000);
  const globalDateStr = formatDateIndian(globalPredictedDate.toISOString().split('T')[0]);

  // Overall status based on nearest exam
  let globalStatus: 'on-track' | 'tight' | 'behind' = 'on-track';
  const nearestDiff = minDaysLeft - globalDaysNeeded;
  if (nearestDiff >= 10) globalStatus = 'on-track';
  else if (nearestDiff >= 0) globalStatus = 'tight';
  else globalStatus = 'behind';

  return {
    totalChapters: globalTotalChapters,
    totalStages: globalTotalStages,
    completedStages: globalCompletedStages,
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
