export type ClassLevel = 'Class 9' | 'Class 10';

export type SubjectName =
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Social Science'
  | 'English'
  | 'Hindi';

export interface Chapter {
  id: string;
  name: string;
  stageStates: number[]; // 0: Pending, 1: In Progress, 2: Done
}

export interface SubjectData {
  examDate: string; // YYYY-MM-DD
  chapters: Chapter[];
  weeklyTargetHours?: number;
}

export interface StudySession {
  id: string;
  subject: SubjectName;
  chapterName?: string;
  durationMinutes: number;
  timestamp: string; // ISO string
  notes?: string;
}

export interface SubjectHabit {
  id: string;
  subject: SubjectName;
  title: string;
  completedDates: string[]; // ['YYYY-MM-DD']
}

export interface DailySleepLog {
  date: string; // YYYY-MM-DD
  hours: number;
  bedTime?: string;
  wakeTime?: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  classLevel: ClassLevel;
  customStages: Record<string, string[]>;
  subjects: Record<string, SubjectData>;
  sessions: StudySession[];
  habits: SubjectHabit[];
  sleepLogs: Record<string, DailySleepLog>; // date key YYYY-MM-DD
  streak: number;
  lastActiveDate: string;
  createdAt: string;
  targetExamName?: string;
}

export type TabType = 'home' | 'chapters' | 'sessions' | 'sleep' | 'insights' | 'resources' | 'settings';
