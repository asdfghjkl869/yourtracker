import { SubjectName, UserProfile } from '../types';
import { SUBJECTS, DEFAULT_STAGES } from '../data/cbseData';

export function formatDateIndian(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function getDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export interface SubjectStats {
  totalStages: number;
  doneStages: number;
  inProgressStages: number;
  pendingStages: number;
  percent: number;
  daysLeft: number;
  pace: string;
  status: 'On Track' | 'Action Required' | 'Passed';
  chaptersCount: number;
  weeklyHoursStudied: number;
  weeklyTargetHours: number;
}

export function calculateSubjectStats(profile: UserProfile, subject: SubjectName): SubjectStats {
  const subData = profile.subjects[subject];
  const stagesList = profile.customStages[subject] || DEFAULT_STAGES[subject] || [];

  if (!subData || !subData.chapters) {
    return {
      totalStages: 0,
      doneStages: 0,
      inProgressStages: 0,
      pendingStages: 0,
      percent: 0,
      daysLeft: 0,
      pace: '0.0',
      status: 'On Track',
      chaptersCount: 0,
      weeklyHoursStudied: 0,
      weeklyTargetHours: 4
    };
  }

  const chaptersCount = subData.chapters.length;
  let doneStages = 0;
  let inProgressStages = 0;

  subData.chapters.forEach(ch => {
    const states = ch.stageStates || [];
    states.slice(0, stagesList.length).forEach(st => {
      if (st === 2) doneStages++;
      else if (st === 1) inProgressStages++;
    });
  });

  const totalStages = chaptersCount * stagesList.length;
  const pendingStages = Math.max(0, totalStages - doneStages);
  const percent = totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0;

  const daysLeft = getDaysRemaining(subData.examDate);

  let status: 'On Track' | 'Action Required' | 'Passed' = 'On Track';
  let pace = '0.0';

  if (daysLeft < 0) {
    status = 'Passed';
    pace = '0.0';
  } else {
    const effectiveDays = Math.max(daysLeft, 1);
    const reqPace = pendingStages / effectiveDays;
    pace = reqPace.toFixed(1);

    if (pendingStages === 0) {
      status = 'On Track';
    } else if (reqPace > 2.5) {
      status = 'Action Required';
    } else {
      status = 'On Track';
    }
  }

  // Calculate past 7 days study hours for this subject
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentSessions = (profile.sessions || []).filter(s => {
    return s.subject === subject && new Date(s.timestamp) >= sevenDaysAgo;
  });
  const weeklyMinutes = recentSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const weeklyHoursStudied = Number((weeklyMinutes / 60).toFixed(1));

  return {
    totalStages,
    doneStages,
    inProgressStages,
    pendingStages,
    percent,
    daysLeft,
    pace,
    status,
    chaptersCount,
    weeklyHoursStudied,
    weeklyTargetHours: subData.weeklyTargetHours || 4
  };
}

export function calculateOverallStats(profile: UserProfile) {
  let totalStages = 0;
  let doneStages = 0;
  let inProgressStages = 0;

  SUBJECTS.forEach(sub => {
    const stats = calculateSubjectStats(profile, sub);
    totalStages += stats.totalStages;
    doneStages += stats.doneStages;
    inProgressStages += stats.inProgressStages;
  });

  const percent = totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0;
  return {
    totalStages,
    doneStages,
    inProgressStages,
    pendingStages: Math.max(0, totalStages - doneStages),
    percent
  };
}

export interface DayTrend {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // "Mon", "Tue", etc.
  fullDate: string; // "Sep 4"
  studyMinutes: number;
  studyHours: number;
  sleepHours: number;
  sleepQuality?: string;
  habitsCompleted: number;
  habitsTotal: number;
}

export function calculateWeeklyTrends(profile: UserProfile): {
  days: DayTrend[];
  totalStudyHours: number;
  avgDailyStudyHours: number;
  avgDailySleepHours: number;
  totalHabitsCompleted: number;
  habitCompletionRate: number;
  subjectBreakdown: { subject: SubjectName; minutes: number; hours: number; percentage: number }[];
} {
  const days: DayTrend[] = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Past 7 days (including today)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = dayNames[d.getDay()];
    const fullDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;

    // Study minutes on this date
    const daySessions = (profile.sessions || []).filter(s => s.timestamp.startsWith(dateStr));
    const studyMinutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    // Sleep hours on this date
    const sleepLog = profile.sleepLogs ? profile.sleepLogs[dateStr] : undefined;
    const sleepHours = sleepLog ? sleepLog.hours : 0;
    const sleepQuality = sleepLog ? sleepLog.quality : undefined;

    // Habits on this date
    const totalHabits = profile.habits ? profile.habits.length : 0;
    const completedHabits = profile.habits
      ? profile.habits.filter(h => h.completedDates && h.completedDates.includes(dateStr)).length
      : 0;

    days.push({
      dateStr,
      dayLabel,
      fullDate,
      studyMinutes,
      studyHours: Number((studyMinutes / 60).toFixed(1)),
      sleepHours,
      sleepQuality,
      habitsCompleted: completedHabits,
      habitsTotal: totalHabits
    });
  }

  const totalStudyMinutes = days.reduce((acc, d) => acc + d.studyMinutes, 0);
  const totalStudyHours = Number((totalStudyMinutes / 60).toFixed(1));
  const avgDailyStudyHours = Number((totalStudyHours / 7).toFixed(1));

  const sleepDaysLogged = days.filter(d => d.sleepHours > 0);
  const totalSleepHours = sleepDaysLogged.reduce((acc, d) => acc + d.sleepHours, 0);
  const avgDailySleepHours = sleepDaysLogged.length > 0 ? Number((totalSleepHours / sleepDaysLogged.length).toFixed(1)) : 0;

  const totalHabitsCompleted = days.reduce((acc, d) => acc + d.habitsCompleted, 0);
  const totalPossibleHabits = days.reduce((acc, d) => acc + d.habitsTotal, 0);
  const habitCompletionRate = totalPossibleHabits > 0 ? Math.round((totalHabitsCompleted / totalPossibleHabits) * 100) : 0;

  // Subject breakdown for this 7-day window
  const subjectMinutesMap: Record<string, number> = {};
  SUBJECTS.forEach(sub => {
    subjectMinutesMap[sub] = 0;
  });

  const sevenDaysDateStrings = new Set(days.map(d => d.dateStr));
  (profile.sessions || []).forEach(s => {
    const sDate = s.timestamp.split('T')[0];
    if (sevenDaysDateStrings.has(sDate)) {
      subjectMinutesMap[s.subject] = (subjectMinutesMap[s.subject] || 0) + s.durationMinutes;
    }
  });

  const subjectBreakdown = SUBJECTS.map(sub => {
    const min = subjectMinutesMap[sub] || 0;
    const hrs = Number((min / 60).toFixed(1));
    const percentage = totalStudyMinutes > 0 ? Math.round((min / totalStudyMinutes) * 100) : 0;
    return {
      subject: sub,
      minutes: min,
      hours: hrs,
      percentage
    };
  }).sort((a, b) => b.minutes - a.minutes);

  return {
    days,
    totalStudyHours,
    avgDailyStudyHours,
    avgDailySleepHours,
    totalHabitsCompleted,
    habitCompletionRate,
    subjectBreakdown
  };
}
