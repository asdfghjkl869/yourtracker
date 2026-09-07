export type ClassLevel = 'Class 9' | 'Class 10';

export type SubjectName =
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Social Science'
  | 'English'
  | 'Hindi';

export type ChapterDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Chapter {
  id: string;
  name: string;
  stageStates: number[]; // 0: Pending, 1: In Progress, 2: Done
  difficulty?: ChapterDifficulty;
  weightage?: number; // Marks in board exam
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

export type EnergyLevel = 'Low' | 'Medium' | 'High';

export type PlanDiversityMode = 'balanced' | 'dual' | 'focus';

export type StageFocusCategory =
  | 'all'
  | 'in_progress'
  | 'theory'
  | 'ncert'
  | 'advanced'
  | 'practice'
  | 'custom';

export type ExamMode = 'Standard' | 'Exam Mode' | 'Panic Mode' | 'Mid-terms' | 'Pre-boards' | 'Final Boards';

export type MistakeReason =
  | 'Conceptual Gap'
  | 'Careless Error'
  | 'Formula / Derivation'
  | 'Calculation Mistake'
  | 'Time Pressure'
  | 'Misread Question'
  | 'Memory Gap';

export interface MistakeEntry {
  id: string;
  date?: string; // YYYY-MM-DD
  loggedDate?: string;
  subject: SubjectName;
  chapterName: string;
  chapterId?: string;
  description?: string;
  mistakeText?: string;
  solution?: string;
  correctConcept?: string;
  reason: MistakeReason;
  tags?: string[];
  resolved?: boolean;
  isResolved?: boolean;
  resolvedDate?: string;
}

export interface DailyTask {
  id: string;
  subject: SubjectName;
  chapterName: string;
  chapterId?: string;
  title?: string;
  taskTitle?: string;
  stageName?: string;
  stageIndex?: number;
  estimatedMinutes: number;
  completed?: boolean;
  isCompleted?: boolean;
  priorityScore?: number;
  reason?: string;
  reasonTag?: string; // e.g. "Weak Chapter", "High Weightage", "Hard Difficulty", "Nearest Exam"
  scheduledTime?: string; // e.g. "09:00"
}

export interface DailyPlan {
  date: string; // YYYY-MM-DD
  energyLevel: EnergyLevel;
  diversityMode?: PlanDiversityMode;
  focusSubject?: SubjectName;
  stageFocus?: StageFocusCategory;
  selectedStages?: string[];
  tasks: DailyTask[];
  generatedAt: string;
  targetTotalMinutes: number;
  targetHours?: number;
}

export interface CalendarBlock {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  subject: SubjectName;
  chapterName?: string;
  chapterId?: string;
  stageName?: string;
  stageIndex?: number;
  title: string;
  notes?: string;
  isCompleted?: boolean;
  taskId?: string;
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

  // New features state
  examMode?: ExamMode;
  energyLevel?: EnergyLevel;
  lastEnergyCheckinDate?: string;
  energyLevels?: Record<string, EnergyLevel>; // YYYY-MM-DD -> Energy
  mistakes?: MistakeEntry[];
  dailyPlans?: Record<string, DailyPlan>; // YYYY-MM-DD -> DailyPlan
  calendarBlocks?: CalendarBlock[];
  panicModeManual?: boolean;
}

export type TabType =
  | 'home'
  | 'planner'
  | 'chapters'
  | 'mistakes'
  | 'sessions'
  | 'sleep'
  | 'insights'
  | 'resources'
  | 'settings';

