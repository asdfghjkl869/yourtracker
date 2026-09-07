import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  SubjectName,
  TabType,
  StudySession,
  DailySleepLog,
  Chapter,
  DailyPlan,
  DailyTask,
  CalendarBlock,
  MistakeEntry,
  EnergyLevel,
  ExamMode,
  ChapterDifficulty
} from './types';
import { SUBJECTS, generateSampleInitialProfile, DEFAULT_STAGES, SYLLABUS_DATA, SUBJECT_COLORS } from './data/cbseData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ExamDayTracker } from './components/ExamDayTracker';
import { SubjectCard } from './components/SubjectCard';
import { StudySessionsAndHabits } from './components/StudySessionsAndHabits';
import { SleepTracker } from './components/SleepTracker';
import { WeeklyTrendsDashboard } from './components/WeeklyTrendsDashboard';
import { ChaptersView } from './components/ChaptersView';
import { SettingsView } from './components/SettingsView';
import { ResourcesView } from './components/ResourcesView';
import { SetupWizard } from './components/SetupWizard';
import { TimeBlockingCalendar } from './components/TimeBlockingCalendar';
import { MistakeJournal } from './components/MistakeJournal';
import { DailyPlanModal } from './components/DailyPlanModal';
import { EnergyCheckinModal } from './components/EnergyCheckinModal';
import { PanicModeBanner } from './components/PanicModeBanner';
import { SyllabusPredictorCard } from './components/SyllabusPredictorCard';
import { DailyStudyChart } from './components/DailyStudyChart';
import { getDaysRemaining, getLocalDateString } from './utils/helpers';
import {
  Sparkles,
  Play,
  Moon,
  CheckSquare,
  Zap,
  BookOpen,
  Flame,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus
} from 'lucide-react';

const STORAGE_KEY = 'umang_cbse_profiles';
const ACTIVE_PROFILE_KEY = 'umang_cbse_active_id';
const THEME_KEY = 'umang_cbse_theme';

export default function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isDark, setIsDark] = useState<boolean>(true);

  // Cross-component navigation state
  const [targetSubjectForChapters, setTargetSubjectForChapters] = useState<SubjectName>('Mathematics');
  const [targetSubjectForSession, setTargetSubjectForSession] = useState<SubjectName>('Mathematics');
  const [targetSubjectForMistakes, setTargetSubjectForMistakes] = useState<SubjectName>('Mathematics');
  const [targetChapterForMistakes, setTargetChapterForMistakes] = useState<string>('');
  const [plannerTargetDate, setPlannerTargetDate] = useState<string | undefined>(undefined);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | undefined>(undefined);

  // Feature Modals & Alerts
  const [showDailyPlanModal, setShowDailyPlanModal] = useState<boolean>(false);
  const [showEnergyModal, setShowEnergyModal] = useState<boolean>(false);
  const [panicDismissed, setPanicDismissed] = useState<boolean>(false);

  // Setup Wizard
  const [showWizard, setShowWizard] = useState<boolean>(false);

  // Undo & Toast notifications
  const [toast, setToast] = useState<{ message: string; undoAction?: () => void } | null>(null);
  const [cutChapterBackup, setCutChapterBackup] = useState<{
    profileId: string;
    subject: SubjectName;
    chapter: Chapter;
    index: number;
  } | null>(null);

  // Initialize on load
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light') {
      setIsDark(false);
      document.body.classList.add('light-theme');
    } else {
      setIsDark(true);
      document.body.classList.remove('light-theme');
    }

    // Profiles
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: UserProfile[] = JSON.parse(stored);
        if (parsed && parsed.length > 0) {
          // If previous session contained the old default 'Umang' profile, auto-migrate to fresh reset profile
          const hasOldDefault = parsed.some(p => p.name === 'Umang');
          if (hasOldDefault) {
            const fresh = generateSampleInitialProfile();
            setProfiles([fresh]);
            setActiveProfileId(fresh.id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify([fresh]));
            localStorage.setItem(ACTIVE_PROFILE_KEY, fresh.id);
            return;
          }
          setProfiles(parsed);
          const savedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);
          const matched = parsed.find(p => p.id === savedActiveId);
          setActiveProfileId(matched ? matched.id : parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to parse profiles from localStorage', e);
    }

    // Fallback: seed fresh initial profile
    const initial = generateSampleInitialProfile();
    setProfiles([initial]);
    setActiveProfileId(initial.id);
  }, []);

  // Save to localStorage whenever profiles change
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      if (activeProfileId) {
        localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
      }
    }
  }, [profiles, activeProfileId]);

  // Streak update on date change
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || null;

  useEffect(() => {
    if (!activeProfile) return;
    const today = new Date().toISOString().split('T')[0];
    if (activeProfile.lastActiveDate !== today) {
      const last = new Date(activeProfile.lastActiveDate);
      const cur = new Date(today);
      const diffDays = Math.round((cur.getTime() - last.getTime()) / (1000 * 3600 * 24));

      setProfiles(prev =>
        prev.map(p => {
          if (p.id === activeProfile.id) {
            let newStreak = p.streak || 1;
            if (diffDays === 1) newStreak += 1;
            else if (diffDays > 1) newStreak = 1;
            return {
              ...p,
              streak: newStreak,
              lastActiveDate: today
            };
          }
          return p;
        })
      );
    }
  }, [activeProfile]);

  const showNotification = (message: string, undoAction?: () => void) => {
    setToast({ message, undoAction });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, undoAction ? 5000 : 2600);
  };

  const handleToggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.body.classList.remove('light-theme');
        localStorage.setItem(THEME_KEY, 'dark');
      } else {
        document.body.classList.add('light-theme');
        localStorage.setItem(THEME_KEY, 'light');
      }
      return next;
    });
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setProfiles(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    showNotification('Settings updated! ✓');
  };

  // --- Handlers for Priority 2: Study Sessions & Daily Habits ---
  const handleAddSession = (sessionData: Omit<StudySession, 'id'>) => {
    if (!activeProfile) return;
    const newSession: StudySession = {
      ...sessionData,
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    };

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            sessions: [newSession, ...(p.sessions || [])]
          };
        }
        return p;
      })
    );
    showNotification(`Logged ${sessionData.durationMinutes}m study session for ${sessionData.subject}! 📚`);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!activeProfile) return;
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            sessions: (p.sessions || []).filter(s => s.id !== sessionId)
          };
        }
        return p;
      })
    );
    showNotification('Study session removed.');
  };

  const handleToggleHabit = (habitId: string, dateStr: string) => {
    if (!activeProfile) return;
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const updatedHabits = (p.habits || []).map(h => {
            if (h.id === habitId) {
              const dates = h.completedDates || [];
              const isCompleted = dates.includes(dateStr);
              return {
                ...h,
                completedDates: isCompleted
                  ? dates.filter(d => d !== dateStr)
                  : [...dates, dateStr]
              };
            }
            return h;
          });
          return {
            ...p,
            habits: updatedHabits
          };
        }
        return p;
      })
    );
  };

  const handleAddHabit = (subject: SubjectName, title: string) => {
    if (!activeProfile) return;
    const newHabit = {
      id: 'hab_' + Date.now(),
      subject,
      title,
      completedDates: []
    };
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            habits: [...(p.habits || []), newHabit]
          };
        }
        return p;
      })
    );
    showNotification(`Added habit to ${subject}!`);
  };

  const handleDeleteHabit = (habitId: string) => {
    if (!activeProfile) return;
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            habits: (p.habits || []).filter(h => h.id !== habitId)
          };
        }
        return p;
      })
    );
    showNotification('Habit removed.');
  };

  // --- Handlers for Priority 4: Sleep Tracker ---
  const handleSaveSleepLog = (log: DailySleepLog) => {
    if (!activeProfile) return;
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            sleepLogs: {
              ...(p.sleepLogs || {}),
              [log.date]: log
            }
          };
        }
        return p;
      })
    );
    showNotification(`Saved ${log.hours}h sleep record for ${log.date}! 🌙`);
  };

  const handleDeleteSleepLog = (dateStr: string) => {
    if (!activeProfile) return;
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const copy = { ...(p.sleepLogs || {}) };
          delete copy[dateStr];
          return {
            ...p,
            sleepLogs: copy
          };
        }
        return p;
      })
    );
    showNotification('Sleep log removed.');
  };

  // --- Handlers for Chapter Stages & Cutting with Undo ---
  const handleCycleStage = (subject: SubjectName, chapterId: string, stageIdx: number) => {
    if (!activeProfile) return;
    const today = new Date().toISOString().split('T')[0];
    const stages = activeProfile.customStages[subject] || DEFAULT_STAGES[subject] || [];
    const stageTitle = stages[stageIdx] || '';
    let newStageState = 0;
    let targetChapterName = '';

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[subject];
          if (!subData) return p;
          const updatedChapters = subData.chapters.map(ch => {
            if (ch.id === chapterId) {
              targetChapterName = ch.name;
              const current = ch.stageStates[stageIdx] || 0;
              const next = (current + 1) % 3;
              newStageState = next;
              const newStates = [...ch.stageStates];
              newStates[stageIdx] = next;
              return { ...ch, stageStates: newStates };
            }
            return ch;
          });

          // Sync with Today's daily plan
          const plan = p.dailyPlans?.[today];
          let updatedPlans = p.dailyPlans;
          if (plan) {
            const isDone = newStageState === 2;
            const updatedTasks = plan.tasks.map(t => {
              const matches =
                t.subject === subject &&
                (t.chapterId === chapterId || t.chapterName === targetChapterName) &&
                (t.stageIndex === stageIdx || t.stageName === stageTitle);
              if (matches) {
                return { ...t, isCompleted: isDone, completed: isDone };
              }
              return t;
            });
            updatedPlans = {
              ...(p.dailyPlans || {}),
              [today]: {
                ...plan,
                tasks: updatedTasks
              }
            };
          }

          // Sync with calendar blocks
          const updatedBlocks = (p.calendarBlocks || []).map(b => {
            const matches =
              b.subject === subject &&
              (b.chapterId === chapterId || b.chapterName === targetChapterName) &&
              (b.stageIndex === stageIdx || b.stageName === stageTitle);
            if (matches) {
              return { ...b, isCompleted: newStageState === 2 };
            }
            return b;
          });

          return {
            ...p,
            subjects: {
              ...p.subjects,
              [subject]: { ...subData, chapters: updatedChapters }
            },
            dailyPlans: updatedPlans,
            calendarBlocks: updatedBlocks
          };
        }
        return p;
      })
    );

    if (newStageState === 2) {
      showNotification(`"${stageTitle}" completed! Synced to planner +20 XP 🌟`);
    }
  };

  const handleMarkAllDone = (subject: SubjectName, chapterId: string) => {
    if (!activeProfile) return;
    const today = new Date().toISOString().split('T')[0];
    const stages = activeProfile.customStages[subject] || DEFAULT_STAGES[subject];
    let chName = '';

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[subject];
          if (!subData) return p;
          const updated = subData.chapters.map(ch => {
            if (ch.id === chapterId) {
              chName = ch.name;
              return { ...ch, stageStates: stages.map(() => 2) };
            }
            return ch;
          });

          const plan = p.dailyPlans?.[today];
          let updatedPlans = p.dailyPlans;
          if (plan) {
            const updatedTasks = plan.tasks.map(t => {
              if (t.subject === subject && (t.chapterId === chapterId || t.chapterName === chName)) {
                return { ...t, isCompleted: true, completed: true };
              }
              return t;
            });
            updatedPlans = {
              ...(p.dailyPlans || {}),
              [today]: { ...plan, tasks: updatedTasks }
            };
          }

          const updatedBlocks = (p.calendarBlocks || []).map(b => {
            if (b.subject === subject && (b.chapterId === chapterId || b.chapterName === chName)) {
              return { ...b, isCompleted: true };
            }
            return b;
          });

          return {
            ...p,
            subjects: { ...p.subjects, [subject]: { ...subData, chapters: updated } },
            dailyPlans: updatedPlans,
            calendarBlocks: updatedBlocks
          };
        }
        return p;
      })
    );
    showNotification(`All stages marked complete & synced to planner! 🚀`);
  };

  const handleResetStages = (subject: SubjectName, chapterId: string) => {
    if (!activeProfile) return;
    const today = new Date().toISOString().split('T')[0];
    const stages = activeProfile.customStages[subject] || DEFAULT_STAGES[subject];
    let chName = '';

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[subject];
          if (!subData) return p;
          const updated = subData.chapters.map(ch => {
            if (ch.id === chapterId) {
              chName = ch.name;
              return { ...ch, stageStates: stages.map(() => 0) };
            }
            return ch;
          });

          const plan = p.dailyPlans?.[today];
          let updatedPlans = p.dailyPlans;
          if (plan) {
            const updatedTasks = plan.tasks.map(t => {
              if (t.subject === subject && (t.chapterId === chapterId || t.chapterName === chName)) {
                return { ...t, isCompleted: false, completed: false };
              }
              return t;
            });
            updatedPlans = {
              ...(p.dailyPlans || {}),
              [today]: { ...plan, tasks: updatedTasks }
            };
          }

          const updatedBlocks = (p.calendarBlocks || []).map(b => {
            if (b.subject === subject && (b.chapterId === chapterId || b.chapterName === chName)) {
              return { ...b, isCompleted: false };
            }
            return b;
          });

          return {
            ...p,
            subjects: { ...p.subjects, [subject]: { ...subData, chapters: updated } },
            dailyPlans: updatedPlans,
            calendarBlocks: updatedBlocks
          };
        }
        return p;
      })
    );
    showNotification('Stages reset to pending & planner synced.');
  };

  const handleCutChapter = (subject: SubjectName, chapterId: string) => {
    if (!activeProfile) return;
    const subData = activeProfile.subjects[subject];
    if (!subData) return;
    const idx = subData.chapters.findIndex(c => c.id === chapterId);
    if (idx === -1) return;
    const removedChapter = subData.chapters[idx];

    // Store backup for undo
    setCutChapterBackup({
      profileId: activeProfile.id,
      subject,
      chapter: JSON.parse(JSON.stringify(removedChapter)),
      index: idx
    });

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const newChaps = [...subData.chapters];
          newChaps.splice(idx, 1);
          return {
            ...p,
            subjects: {
              ...p.subjects,
              [subject]: { ...subData, chapters: newChaps }
            }
          };
        }
        return p;
      })
    );

    showNotification(`Removed "${removedChapter.name}"`, handleUndoCutChapter);
  };

  const handleUndoCutChapter = () => {
    if (!cutChapterBackup || !activeProfile) return;
    if (cutChapterBackup.profileId !== activeProfile.id) return;

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[cutChapterBackup.subject];
          if (!subData) return p;
          const newChaps = [...subData.chapters];
          const insertIdx = Math.min(cutChapterBackup.index, newChaps.length);
          newChaps.splice(insertIdx, 0, cutChapterBackup.chapter);
          return {
            ...p,
            subjects: {
              ...p.subjects,
              [cutChapterBackup.subject]: { ...subData, chapters: newChaps }
            }
          };
        }
        return p;
      })
    );

    const name = cutChapterBackup.chapter.name;
    setCutChapterBackup(null);
    showNotification(`Restored "${name}"! 🎉`);
  };

  const handleRenameChapter = (subject: SubjectName, chapterId: string, newName: string) => {
    if (!activeProfile) return;
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[subject];
          if (!subData) return p;
          const updated = subData.chapters.map(ch => (ch.id === chapterId ? { ...ch, name: newName } : ch));
          return {
            ...p,
            subjects: { ...p.subjects, [subject]: { ...subData, chapters: updated } }
          };
        }
        return p;
      })
    );
    showNotification('Chapter renamed! ✓');
  };

  const handleAddChapter = (subject: SubjectName, chapterName: string) => {
    if (!activeProfile) return;
    const stages = activeProfile.customStages[subject] || DEFAULT_STAGES[subject];
    const newChapter: Chapter = {
      id: 'ch_' + Date.now(),
      name: chapterName,
      stageStates: stages.map(() => 0)
    };

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[subject] || { examDate: '', chapters: [] };
          return {
            ...p,
            subjects: {
              ...p.subjects,
              [subject]: { ...subData, chapters: [...subData.chapters, newChapter] }
            }
          };
        }
        return p;
      })
    );
    showNotification(`Added "${chapterName}" to ${subject}! ✨`);
  };

  const handleRestoreCBSE = (subject: SubjectName) => {
    if (!activeProfile) return;
    const defaultList = (SYLLABUS_DATA[activeProfile.classLevel] && SYLLABUS_DATA[activeProfile.classLevel][subject]) || [];
    const stages = activeProfile.customStages[subject] || DEFAULT_STAGES[subject];

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const existingChaps = p.subjects[subject]?.chapters || [];
          const existingMap: Record<string, Chapter> = {};
          existingChaps.forEach(c => {
            existingMap[c.name.trim().toLowerCase()] = c;
          });

          const restored = defaultList.map(chName => {
            const found = existingMap[chName.trim().toLowerCase()];
            if (found) return found;
            return {
              id: 'ch_' + Math.random().toString(36).substring(2, 9),
              name: chName,
              stageStates: stages.map(() => 0)
            };
          });

          return {
            ...p,
            subjects: {
              ...p.subjects,
              [subject]: {
                examDate: p.subjects[subject]?.examDate || '',
                chapters: restored
              }
            }
          };
        }
        return p;
      })
    );
    showNotification(`Restored standard CBSE syllabus for ${subject}! 📚`);
  };

  // --- Export / Import JSON & Reset ---
  const handleExportJSON = () => {
    const data = {
      umang_cbse_profiles: profiles,
      activeProfileId,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `umang_cbse_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Backup exported successfully! 📁');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed.umang_cbse_profiles) && parsed.umang_cbse_profiles.length > 0) {
          setProfiles(parsed.umang_cbse_profiles);
          setActiveProfileId(parsed.activeProfileId || parsed.umang_cbse_profiles[0].id);
          showNotification('Backup restored successfully! 🎉');
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          setProfiles(parsed);
          setActiveProfileId(parsed[0].id);
          showNotification('Backup restored successfully! 🎉');
        } else {
          showNotification('Invalid JSON backup format.');
        }
      } catch (err) {
        showNotification('Error reading JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetAllData = () => {
    if (window.confirm('Are you sure you want to permanently reset all profiles and study progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
      const initial = generateSampleInitialProfile();
      setProfiles([initial]);
      setActiveProfileId(initial.id);
      setActiveTab('home');
      showNotification('App reset to fresh state.');
    }
  };

  // --- Handlers for Daily Plan Generator & Daily Quest ---
  const handleSaveDailyPlan = (plan: DailyPlan) => {
    if (!activeProfile) return;
    const dateStr = plan.date;
    const existingBlocks = activeProfile.calendarBlocks || [];

    const occupiedHours = new Set(
      existingBlocks
        .filter(b => b.date === dateStr)
        .map(b => parseInt(b.startTime.split(':')[0], 10))
    );

    const candidateHours = [9, 11, 13, 15, 17, 19, 20, 10, 14, 16, 18, 21];
    let candidateIdx = 0;
    const updatedBlocks = [...existingBlocks];

    plan.tasks.forEach(t => {
      const taskDone = !!(t.isCompleted ?? t.completed);
      const existingIdx = updatedBlocks.findIndex(
        b =>
          b.date === dateStr &&
          (b.id === t.id ||
            b.id === `blk_${t.id}` ||
            (b.subject === t.subject &&
              ((t.chapterId && b.chapterId === t.chapterId) ||
                (t.chapterName && b.chapterName === t.chapterName) ||
                b.title === (t.title || t.taskTitle))))
      );

      if (existingIdx >= 0) {
        updatedBlocks[existingIdx] = {
          ...updatedBlocks[existingIdx],
          isCompleted: taskDone,
          title: t.title || t.taskTitle || updatedBlocks[existingIdx].title
        };
      } else {
        while (candidateIdx < candidateHours.length && occupiedHours.has(candidateHours[candidateIdx])) {
          candidateIdx++;
        }
        const hour = candidateIdx < candidateHours.length ? candidateHours[candidateIdx] : 9 + ((candidateIdx * 2) % 12);
        candidateIdx++;
        occupiedHours.add(hour);

        const durationMins = t.estimatedMinutes || 45;
        const sh = String(hour).padStart(2, '0');
        const totalEndMins = hour * 60 + durationMins;
        const endH = Math.floor(totalEndMins / 60);
        const endM = totalEndMins % 60;
        const eh = String(endH).padStart(2, '0');
        const em = String(endM).padStart(2, '0');

        updatedBlocks.push({
          id: t.id ? `blk_${t.id}` : 'blk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          date: dateStr,
          startTime: `${sh}:00`,
          endTime: `${eh}:${em}`,
          subject: t.subject,
          chapterId: t.chapterId,
          chapterName: t.chapterName,
          stageName: t.stageName,
          stageIndex: t.stageIndex,
          title: t.title || t.taskTitle || 'Study Task',
          isCompleted: taskDone
        });
      }
    });

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            dailyPlans: {
              ...(p.dailyPlans || {}),
              [plan.date]: plan
            },
            calendarBlocks: updatedBlocks
          };
        }
        return p;
      })
    );
    setShowDailyPlanModal(false);
    showNotification("Today's study plan saved and auto-synced with Calendar! 🎯📅");
  };

  const handleToggleDailyTask = (taskId: string) => {
    if (!activeProfile) return;
    const today = getLocalDateString(new Date());
    const plan = activeProfile.dailyPlans?.[today];
    if (!plan) return;

    let isNowDone = false;
    let toggledTask: DailyTask | undefined;
    const updatedTasks = plan.tasks.map(t => {
      if (t.id === taskId) {
        const nextVal = !(t.isCompleted ?? t.completed);
        isNowDone = nextVal;
        toggledTask = { ...t, isCompleted: nextVal, completed: nextVal };
        return toggledTask;
      }
      return t;
    });

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          let updatedSubjects = p.subjects;
          if (toggledTask && toggledTask.chapterId && toggledTask.subject && p.subjects[toggledTask.subject]) {
            const subName = toggledTask.subject;
            const subData = p.subjects[subName];
            const stages = p.customStages[subName] || DEFAULT_STAGES[subName] || [];

            let stageIdx = toggledTask.stageIndex;
            if (stageIdx === undefined && toggledTask.stageName) {
              stageIdx = stages.findIndex(s => s === toggledTask?.stageName);
            }

            if (stageIdx !== undefined && stageIdx >= 0) {
              const updatedChapters = subData.chapters.map(ch => {
                if (ch.id === toggledTask?.chapterId || ch.name === toggledTask?.chapterName) {
                  const newStates = [...(ch.stageStates || [])];
                  newStates[stageIdx] = isNowDone ? 2 : 1;
                  return { ...ch, stageStates: newStates };
                }
                return ch;
              });

              updatedSubjects = {
                ...p.subjects,
                [subName]: {
                  ...subData,
                  chapters: updatedChapters
                }
              };
            }
          }

          // Two-way sync: Also sync completion status to matching Calendar Blocks for today
          const updatedCalendarBlocks = (p.calendarBlocks || []).map(b => {
            if (b.date === today) {
              const matchesId = b.id === taskId || b.id === `blk_${taskId}`;
              const matchesTask =
                (b.title === (toggledTask?.title || toggledTask?.taskTitle)) ||
                (toggledTask?.chapterName &&
                  b.chapterName === toggledTask.chapterName &&
                  b.subject === toggledTask.subject &&
                  (b.stageIndex === toggledTask.stageIndex || b.stageName === toggledTask.stageName));

              if (matchesId || matchesTask) {
                return { ...b, isCompleted: isNowDone };
              }
            }
            return b;
          });

          return {
            ...p,
            subjects: updatedSubjects,
            dailyPlans: {
              ...(p.dailyPlans || {}),
              [today]: {
                ...plan,
                tasks: updatedTasks
              }
            },
            calendarBlocks: updatedCalendarBlocks
          };
        }
        return p;
      })
    );

    if (isNowDone) {
      showNotification('Quest task completed & synced with Calendar! +25 XP 🌟');
    }
  };

  const handleSyncPlanToCalendar = (tasks: DailyTask[], targetDate?: string) => {
    if (!activeProfile) return;
    const dateStr = targetDate || getLocalDateString(new Date());
    const existingBlocks = activeProfile.calendarBlocks || [];

    const occupiedHours = new Set(
      existingBlocks
        .filter(b => b.date === dateStr)
        .map(b => parseInt(b.startTime.split(':')[0], 10))
    );

    const candidateHours = [9, 11, 13, 15, 17, 19, 20, 10, 14, 16, 18, 21];
    let candidateIdx = 0;
    const updatedBlocks = [...existingBlocks];
    let addedCount = 0;

    tasks.forEach(t => {
      const taskDone = !!(t.isCompleted ?? t.completed);
      const existingIdx = updatedBlocks.findIndex(
        b =>
          b.date === dateStr &&
          (b.id === t.id ||
            b.id === `blk_${t.id}` ||
            (b.subject === t.subject &&
              ((t.chapterId && b.chapterId === t.chapterId) ||
                (t.chapterName && b.chapterName === t.chapterName) ||
                b.title === (t.title || t.taskTitle))))
      );

      if (existingIdx >= 0) {
        updatedBlocks[existingIdx] = {
          ...updatedBlocks[existingIdx],
          isCompleted: taskDone,
          title: t.title || t.taskTitle || updatedBlocks[existingIdx].title
        };
      } else {
        while (candidateIdx < candidateHours.length && occupiedHours.has(candidateHours[candidateIdx])) {
          candidateIdx++;
        }
        const hour = candidateIdx < candidateHours.length ? candidateHours[candidateIdx] : 9 + ((candidateIdx * 2) % 12);
        candidateIdx++;
        occupiedHours.add(hour);

        const durationMins = t.estimatedMinutes || 45;
        const sh = String(hour).padStart(2, '0');
        const totalEndMins = hour * 60 + durationMins;
        const endH = Math.floor(totalEndMins / 60);
        const endM = totalEndMins % 60;
        const eh = String(endH).padStart(2, '0');
        const em = String(endM).padStart(2, '0');

        updatedBlocks.push({
          id: t.id ? `blk_${t.id}` : 'blk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          date: dateStr,
          startTime: `${sh}:00`,
          endTime: `${eh}:${em}`,
          subject: t.subject,
          chapterId: t.chapterId,
          chapterName: t.chapterName,
          stageName: t.stageName,
          stageIndex: t.stageIndex,
          title: t.title || t.taskTitle || 'Study Task',
          isCompleted: taskDone
        });
        addedCount++;
      }
    });

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            calendarBlocks: updatedBlocks
          };
        }
        return p;
      })
    );

    showNotification(
      addedCount > 0
        ? `Synced ${addedCount} task block${addedCount > 1 ? 's' : ''} to Calendar Planner! 📅`
        : `Daily Tracker & Calendar Planner are fully in sync! 📅✨`
    );
  };

  const handleAddStageToTodayPlan = (
    subject: SubjectName,
    chapterId: string,
    chapterName: string,
    stageName: string,
    stageIdx: number,
    durationMinutes = 45,
    openInPlanner = true
  ) => {
    if (!activeProfile) return;
    const today = getLocalDateString(new Date());
    const existingPlan = activeProfile.dailyPlans?.[today];
    const existingTasks = existingPlan?.tasks || [];

    const isAlreadyAdded = existingTasks.some(
      t =>
        t.subject === subject &&
        (t.chapterId === chapterId || t.chapterName === chapterName) &&
        (t.stageIndex === stageIdx || t.stageName === stageName)
    );

    let taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    let updatedTasks = existingTasks;

    if (!isAlreadyAdded) {
      const newTask: DailyTask = {
        id: taskId,
        subject,
        chapterId,
        chapterName,
        stageName,
        stageIndex: stageIdx,
        title: `${stageName} — ${chapterName}`,
        taskTitle: `${stageName} — ${chapterName}`,
        estimatedMinutes: durationMinutes,
        completed: false,
        isCompleted: false,
        reasonTag: 'Added from Syllabus',
        reason: `Direct syllabus focus on ${stageName}`,
        scheduledTime: '16:00'
      };
      updatedTasks = [...existingTasks, newTask];
    }

    // Auto-create a CalendarBlock for today in the Time Blocking Calendar if not already present
    const existingBlocks = activeProfile.calendarBlocks || [];
    const matchedBlock = existingBlocks.find(
      b =>
        b.date === today &&
        b.subject === subject &&
        (b.chapterId === chapterId || b.chapterName === chapterName) &&
        (b.stageIndex === stageIdx || b.stageName === stageName)
    );

    let blockId = matchedBlock
      ? matchedBlock.id
      : 'blk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    let newBlocks = existingBlocks;

    if (!matchedBlock) {
      const plannedHours = new Set(
        existingBlocks
          .filter(b => b.date === today)
          .map(b => parseInt(b.startTime.split(':')[0], 10))
      );
      let targetHour = 16;
      for (const h of [16, 17, 18, 19, 10, 11, 14, 15, 20]) {
        if (!plannedHours.has(h)) {
          targetHour = h;
          break;
        }
      }
      const startHStr = String(targetHour).padStart(2, '0');
      const endHStr = String(targetHour + 1).padStart(2, '0');

      const newBlock: CalendarBlock = {
        id: blockId,
        date: today,
        startTime: `${startHStr}:00`,
        endTime: `${endHStr}:00`,
        subject,
        chapterId,
        chapterName,
        stageName,
        stageIndex: stageIdx,
        title: `${stageName} — ${chapterName}`,
        isCompleted: false
      };
      newBlocks = [...existingBlocks, newBlock];
    }

    const totalMins = updatedTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
    const updatedPlan: DailyPlan = {
      date: today,
      energyLevel: existingPlan?.energyLevel || 'Medium',
      diversityMode: existingPlan?.diversityMode || 'balanced',
      focusSubject: existingPlan?.focusSubject,
      stageFocus: existingPlan?.stageFocus || 'all',
      tasks: updatedTasks,
      generatedAt: existingPlan?.generatedAt || new Date().toISOString(),
      targetTotalMinutes: totalMins,
      targetHours: Number((totalMins / 60).toFixed(1))
    };

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[subject];
          let updatedChapters = subData?.chapters;
          if (subData?.chapters) {
            updatedChapters = subData.chapters.map(ch => {
              if (ch.id === chapterId || ch.name === chapterName) {
                const newStates = [...(ch.stageStates || [])];
                if ((newStates[stageIdx] || 0) === 0) {
                  newStates[stageIdx] = 1;
                }
                return { ...ch, stageStates: newStates };
              }
              return ch;
            });
          }

          return {
            ...p,
            subjects: updatedChapters
              ? {
                  ...p.subjects,
                  [subject]: { ...subData, chapters: updatedChapters }
                }
              : p.subjects,
            dailyPlans: {
              ...(p.dailyPlans || {}),
              [today]: updatedPlan
            },
            calendarBlocks: newBlocks
          };
        }
        return p;
      })
    );

    if (openInPlanner) {
      setPlannerTargetDate(today);
      setHighlightedBlockId(blockId);
      setActiveTab('planner');
      showNotification(`Added "${stageName} — ${chapterName}" to Planner & Today's Plan! 🎯`);
    } else {
      showNotification(`Added "${stageName} — ${chapterName}" to Today's Plan! 🎯`);
    }
  };

  const handleAddStageToWeeklyPlan = (
    subject: SubjectName,
    chapterId: string,
    chapterName: string,
    stageName: string,
    stageIdx: number,
    targetDateStr?: string,
    startTime = '15:00',
    durationMinutes = 60,
    openInPlanner = true
  ) => {
    if (!activeProfile) return;
    let dateStr = targetDateStr;
    if (!dateStr) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateStr = getLocalDateString(tomorrow);
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const totalEndMins = (startH || 0) * 60 + (startM || 0) + durationMinutes;
    const endH = Math.min(23, Math.floor(totalEndMins / 60));
    const endM = totalEndMins % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const newBlockId = 'blk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newBlock: CalendarBlock = {
      id: newBlockId,
      date: dateStr,
      startTime,
      endTime,
      subject,
      chapterId,
      chapterName,
      stageName,
      stageIndex: stageIdx,
      title: `${stageName} — ${chapterName}`,
      isCompleted: false
    };

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[subject];
          let updatedChapters = subData?.chapters;
          if (subData?.chapters) {
            updatedChapters = subData.chapters.map(ch => {
              if (ch.id === chapterId || ch.name === chapterName) {
                const newStates = [...(ch.stageStates || [])];
                if ((newStates[stageIdx] || 0) === 0) {
                  newStates[stageIdx] = 1;
                }
                return { ...ch, stageStates: newStates };
              }
              return ch;
            });
          }

          return {
            ...p,
            subjects: updatedChapters
              ? {
                  ...p.subjects,
                  [subject]: { ...subData, chapters: updatedChapters }
                }
              : p.subjects,
            calendarBlocks: [...(p.calendarBlocks || []), newBlock]
          };
        }
        return p;
      })
    );

    const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    if (openInPlanner) {
      setPlannerTargetDate(dateStr);
      setHighlightedBlockId(newBlockId);
      setActiveTab('planner');
      showNotification(`Scheduled "${stageName}" on ${formattedDate} (${startTime}) in Weekly Planner! 📅`);
    } else {
      showNotification(`Scheduled "${stageName}" on ${formattedDate} (${startTime}) in Weekly Calendar! 📅`);
    }
  };

  // --- Handlers for Daily Energy & Exam Mode ---
  const handleSaveEnergyCheckin = (energy: EnergyLevel) => {
    if (!activeProfile) return;
    const today = new Date().toISOString().split('T')[0];
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            energyLevel: energy,
            energyLevels: {
              ...(p.energyLevels || {}),
              [today]: energy
            },
            lastEnergyCheckinDate: today
          };
        }
        return p;
      })
    );
    setShowEnergyModal(false);
    showNotification(`Energy logged as ${energy}! Study pace adjusted. ⚡`);
  };

  const handleToggleExamMode = () => {
    if (!activeProfile) return;
    const cycle: Record<string, ExamMode> = {
      'Standard': 'Exam Mode',
      'Exam Mode': 'Panic Mode',
      'Panic Mode': 'Standard'
    };
    const currentMode = activeProfile.examMode || 'Standard';
    const nextMode: ExamMode = cycle[currentMode] || 'Standard';
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            examMode: nextMode
          };
        }
        return p;
      })
    );
    showNotification(`Switched mode to: ${nextMode}`);
  };

  // --- Handlers for Mistake Journal ---
  const handleAddMistake = (mistakeData: Omit<MistakeEntry, 'id'>) => {
    if (!activeProfile) return;
    const newEntry: MistakeEntry = {
      ...mistakeData,
      id: 'mst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    };

    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            mistakes: [newEntry, ...(p.mistakes || [])]
          };
        }
        return p;
      })
    );
    showNotification(`Logged mistake in ${mistakeData.subject} • Chapter tagged ⚠️`);
  };

  const handleToggleResolvedMistake = (id: string) => {
    if (!activeProfile) return;
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const updated = (p.mistakes || []).map(m => {
            if (m.id === id) {
              return {
                ...m,
                isResolved: !m.isResolved,
                resolvedDate: !m.isResolved ? new Date().toISOString().split('T')[0] : undefined
              };
            }
            return m;
          });
          return { ...p, mistakes: updated };
        }
        return p;
      })
    );
  };

  const handleDeleteMistake = (id: string) => {
    if (!activeProfile) return;
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            mistakes: (p.mistakes || []).filter(m => m.id !== id)
          };
        }
        return p;
      })
    );
    showNotification('Mistake entry removed.');
  };

  // --- Handlers for Time Blocking Calendar ---
  const handleAddCalendarBlock = (blockData: Omit<CalendarBlock, 'id'>) => {
    if (!activeProfile) return;
    const newBlock: CalendarBlock = {
      ...blockData,
      id: 'blk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    };
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            calendarBlocks: [...(p.calendarBlocks || []), newBlock]
          };
        }
        return p;
      })
    );
    showNotification(`Scheduled study block for ${blockData.subject}! ⏰`);
  };

  const handleDeleteCalendarBlock = (id: string) => {
    if (!activeProfile) return;
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          return {
            ...p,
            calendarBlocks: (p.calendarBlocks || []).filter(b => b.id !== id)
          };
        }
        return p;
      })
    );
    showNotification('Study block removed.');
  };

  const handleUpdateCalendarBlock = (updated: CalendarBlock) => {
    if (!activeProfile) return;
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          let updatedSubjects = p.subjects;
          if (updated.subject && (updated.chapterId || updated.chapterName) && p.subjects[updated.subject]) {
            const subData = p.subjects[updated.subject];
            const stages = p.customStages[updated.subject] || DEFAULT_STAGES[updated.subject] || [];
            let stIdx = updated.stageIndex;
            if (stIdx === undefined && updated.stageName) {
              stIdx = stages.findIndex(s => s === updated.stageName);
            }
            if (stIdx !== undefined && stIdx >= 0) {
              const updatedChapters = subData.chapters.map(ch => {
                if (ch.id === updated.chapterId || ch.name === updated.chapterName) {
                  const newStates = [...(ch.stageStates || [])];
                  newStates[stIdx] = updated.isCompleted ? 2 : 1;
                  return { ...ch, stageStates: newStates };
                }
                return ch;
              });
              updatedSubjects = {
                ...p.subjects,
                [updated.subject]: { ...subData, chapters: updatedChapters }
              };
            }
          }

          // Two-Way Sync: Update Daily Plan for updated.date if exists
          let updatedDailyPlans = p.dailyPlans || {};
          const dayPlan = updatedDailyPlans[updated.date];
          if (dayPlan && dayPlan.tasks) {
            const syncedTasks = dayPlan.tasks.map(t => {
              const matchesId = t.id === updated.id || `blk_${t.id}` === updated.id;
              const matchesTask =
                (t.title === updated.title || t.taskTitle === updated.title) ||
                (updated.chapterName &&
                  t.chapterName === updated.chapterName &&
                  t.subject === updated.subject &&
                  (t.stageIndex === updated.stageIndex || t.stageName === updated.stageName));
              if (matchesId || matchesTask) {
                return {
                  ...t,
                  isCompleted: updated.isCompleted,
                  completed: updated.isCompleted
                };
              }
              return t;
            });
            updatedDailyPlans = {
              ...updatedDailyPlans,
              [updated.date]: {
                ...dayPlan,
                tasks: syncedTasks
              }
            };
          }

          return {
            ...p,
            subjects: updatedSubjects,
            dailyPlans: updatedDailyPlans,
            calendarBlocks: (p.calendarBlocks || []).map(b => (b.id === updated.id ? updated : b))
          };
        }
        return p;
      })
    );
  };

  const handleToggleDifficulty = (subject: SubjectName, chapterId: string, diff: ChapterDifficulty) => {
    if (!activeProfile) return;
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[subject];
          if (!subData) return p;
          const updated = subData.chapters.map(c => (c.id === chapterId ? { ...c, difficulty: diff } : c));
          return {
            ...p,
            subjects: {
              ...p.subjects,
              [subject]: { ...subData, chapters: updated }
            }
          };
        }
        return p;
      })
    );
    showNotification(`Set ${subject} chapter to ${diff} difficulty!`);
  };

  // Smart Focus items for Today's Focus box (balanced across subjects)
  const getSmartFocusItems = () => {
    if (!activeProfile) return [];
    const items: {
      subject: SubjectName;
      chapterName: string;
      stageName: string;
      chapterId: string;
      stageIdx: number;
      isProgress: boolean;
    }[] = [];
    const selectedSubjects = new Set<SubjectName>();

    // Pass 1: In-Progress stages (max 1 per subject for variety)
    for (const sub of SUBJECTS) {
      if (items.length >= 3) break;
      if (selectedSubjects.has(sub)) continue;
      const subData = activeProfile.subjects[sub];
      if (!subData) continue;
      const stages = activeProfile.customStages[sub] || DEFAULT_STAGES[sub];
      for (const ch of subData.chapters) {
        let found = false;
        for (let sIdx = 0; sIdx < stages.length; sIdx++) {
          if (ch.stageStates[sIdx] === 1) {
            items.push({
              subject: sub,
              chapterName: ch.name,
              stageName: stages[sIdx],
              chapterId: ch.id,
              stageIdx: sIdx,
              isProgress: true
            });
            selectedSubjects.add(sub);
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    // Pass 2: Pending stages across other subjects (max 1 per subject)
    for (const sub of SUBJECTS) {
      if (items.length >= 3) break;
      if (selectedSubjects.has(sub)) continue;
      const subData = activeProfile.subjects[sub];
      if (!subData) continue;
      const stages = activeProfile.customStages[sub] || DEFAULT_STAGES[sub];
      for (const ch of subData.chapters) {
        let found = false;
        for (let sIdx = 0; sIdx < stages.length; sIdx++) {
          if (ch.stageStates[sIdx] === 0) {
            items.push({
              subject: sub,
              chapterName: ch.name,
              stageName: stages[sIdx],
              chapterId: ch.id,
              stageIdx: sIdx,
              isProgress: false
            });
            selectedSubjects.add(sub);
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    // Pass 3: If still < 3, allow additional items from any subjects
    if (items.length < 3) {
      for (const sub of SUBJECTS) {
        if (items.length >= 3) break;
        const subData = activeProfile.subjects[sub];
        if (!subData) continue;
        const stages = activeProfile.customStages[sub] || DEFAULT_STAGES[sub];
        for (const ch of subData.chapters) {
          if (items.length >= 3) break;
          for (let sIdx = 0; sIdx < stages.length; sIdx++) {
            if (ch.stageStates[sIdx] !== 2) {
              const alreadyHas = items.some(it => it.chapterId === ch.id && it.stageIdx === sIdx);
              if (!alreadyHas) {
                items.push({
                  subject: sub,
                  chapterName: ch.name,
                  stageName: stages[sIdx],
                  chapterId: ch.id,
                  stageIdx: sIdx,
                  isProgress: ch.stageStates[sIdx] === 1
                });
                break;
              }
            }
          }
        }
      }
    }

    return items;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySleepLog = activeProfile?.sleepLogs ? activeProfile.sleepLogs[todayStr] : undefined;
  const todayDailyPlan = activeProfile?.dailyPlans ? activeProfile.dailyPlans[todayStr] : undefined;
  const unresolvedMistakesCount = (activeProfile?.mistakes || []).filter(m => !m.isResolved).length;
  const todayBlocksCount = (activeProfile?.calendarBlocks || []).filter(b => b.date === todayStr).length;

  return (
    <div className="min-h-screen pb-24 text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <Header
        activeProfile={activeProfile}
        profiles={profiles}
        onSelectProfile={id => setActiveProfileId(id)}
        onAddNewProfile={() => setShowWizard(true)}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onTabChange={tab => setActiveTab(tab)}
        onOpenEnergyCheckin={() => setShowEnergyModal(true)}
        onOpenEnergyModal={() => setShowEnergyModal(true)}
        onExamModeChange={mode => {
          if (!activeProfile) return;
          setProfiles(prev =>
            prev.map(p => (p.id === activeProfile.id ? { ...p, examMode: mode } : p))
          );
          showNotification(`Exam mode set to ${mode}! 🎯`);
        }}
        onToggleExamMode={handleToggleExamMode}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && activeProfile && (
          <div className="space-y-5">
            {/* Panic Mode / Critical Countdown Alert */}
            {!panicDismissed && (activeProfile.examMode === 'Panic Mode' || Object.values(activeProfile.subjects).some(s => {
              const subData = s as { examDate?: string };
              const d = getDaysRemaining(subData?.examDate || '');
              return d <= 5 && d >= 0;
            })) && (
              <PanicModeBanner
                profile={activeProfile}
                onNavigateToChapters={sub => {
                  setTargetSubjectForChapters(sub);
                  setActiveTab('chapters');
                }}
                onTogglePanicManual={handleToggleExamMode}
              />
            )}

            {/* Student Greeting & Streak & Quick Generator Actions */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#f0f6fc] sm:text-3xl">
                  Hi, {activeProfile.name}!
                </h1>
                <p className="mt-0.5 text-xs font-medium text-[#8b949e] sm:text-sm">
                  {activeProfile.classLevel} Dashboard • Track daily syllabus, habits, and rest
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Prominent Auto Daily Plan Generator Button */}
                <button
                  onClick={() => setShowDailyPlanModal(true)}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#58a6ff] to-[#388bfd] px-3.5 py-1.5 text-xs font-black text-[#0b0f19] shadow-lg shadow-sky-500/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Today's Plan</span>
                </button>

                <div className="rounded-full border border-white/10 bg-[#161b22] px-3.5 py-1.5 text-xs font-semibold text-[#f0f6fc]">
                  Streak: <span className="font-bold text-[#d29922]">{activeProfile.streak || 6} Days</span>
                </div>
                <div className="rounded-full bg-[#58a6ff]/15 px-3 py-1.5 text-xs font-bold text-[#58a6ff]">
                  {activeProfile.classLevel}
                </div>
              </div>
            </div>

            {/* PRIORITY 1: Day Tracker at Home page for the Exam */}
            <ExamDayTracker
              profile={activeProfile}
              onOpenSettings={() => setActiveTab('settings')}
              onSelectSubject={sub => {
                setTargetSubjectForChapters(sub);
                setActiveTab('chapters');
              }}
            />

            {/* Feature 4: Syllabus Completion Predictor & Burnout Gauge */}
            <SyllabusPredictorCard
              profile={activeProfile}
              onNavigateToChapters={sub => {
                setTargetSubjectForChapters(sub);
                setActiveTab('chapters');
              }}
            />

            {/* Bento Grid: Modular cards for Quest, Sleep, Progress & Habits */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* Left Column: Daily Study Chart + 7 Subject Cards with Visual Progress Bars */}
              <div className="lg:col-span-8 space-y-5">
                {/* Feature 7: Daily Study Chart / Day View */}
                <DailyStudyChart profile={activeProfile} />

                {/* Subject Progress & Visual Tracking */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="card-title m-0">
                      <span>🎯</span>
                      <span>Subject Progress & Visual Tracking</span>
                    </div>
                    <span className="text-xs font-semibold text-[#8b949e]">
                      7 CBSE Subjects
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {SUBJECTS.map(sub => (
                      <SubjectCard
                        key={sub}
                        subject={sub}
                        profile={activeProfile}
                        onSelectSubject={selectedSub => {
                          setTargetSubjectForChapters(selectedSub);
                          setActiveTab('chapters');
                        }}
                        onStartStudySession={selectedSub => {
                          setTargetSubjectForSession(selectedSub);
                          setActiveTab('sessions');
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Bento Modules (Today's Focus Quest, Sleep Monitor, Mistakes, Calendar) */}
              <div className="lg:col-span-4 space-y-5">
                {/* Bento Card 1: Day Tracker / Daily Quest */}
                <div className="bento-card">
                  <div className="flex items-center justify-between">
                    <div className="card-title m-0">
                      <span>📅</span>
                      <span>Day Tracker: Daily Quest</span>
                    </div>
                    <button
                      onClick={() => setShowDailyPlanModal(true)}
                      className="text-xs font-bold text-[#58a6ff] hover:underline"
                    >
                      {todayDailyPlan ? 'Edit Plan' : 'Auto Plan'}
                    </button>
                  </div>
                  <p className="mt-1 mb-3 text-xs text-[#8b949e]">
                    {todayDailyPlan
                      ? `Generated plan for ${todayDailyPlan.energyLevel} energy (${todayDailyPlan.targetHours} hrs)`
                      : 'Priority chapters scheduled based on CBSE datesheet pace.'}
                  </p>

                  {/* Tasks List */}
                  {todayDailyPlan && todayDailyPlan.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {todayDailyPlan.tasks.map(task => {
                        const isDone = task.isCompleted ?? task.completed ?? false;
                        const subColor = SUBJECT_COLORS[task.subject]?.accent || '#58a6ff';
                        const isSyncedToCalendar = (activeProfile?.calendarBlocks || []).some(
                          b =>
                            b.date === todayStr &&
                            (b.id === task.id ||
                              b.id === `blk_${task.id}` ||
                              (b.subject === task.subject &&
                                ((task.chapterId && b.chapterId === task.chapterId) ||
                                  (task.chapterName && b.chapterName === task.chapterName) ||
                                  b.title === (task.title || task.taskTitle))))
                        );

                        return (
                          <div
                            key={task.id}
                            onClick={() => handleToggleDailyTask(task.id)}
                            className={`group flex items-start gap-3 rounded-xl border p-2.5 transition-all cursor-pointer ${
                              isDone
                                ? 'border-emerald-500/30 bg-emerald-500/10'
                                : 'border-white/10 bg-[#0d1117] hover:border-white/20 hover:bg-white/[0.02]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => {}}
                              className="mt-0.5 h-4 w-4 rounded accent-[#238636] pointer-events-none shrink-0"
                            />
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span
                                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                  style={{
                                    backgroundColor: `${subColor}18`,
                                    color: subColor,
                                    border: `1px solid ${subColor}30`
                                  }}
                                >
                                  {task.subject}
                                </span>
                                {isSyncedToCalendar && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 text-[9px] font-medium text-sky-400"
                                    title="Synchronized in Calendar Planner"
                                  >
                                    <Calendar className="h-2.5 w-2.5" />
                                    <span>In Calendar</span>
                                  </span>
                                )}
                                {task.stageName && (
                                  <span className="text-[10px] text-[#8b949e] truncate max-w-[130px]">
                                    {task.stageName}
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-xs font-medium leading-snug text-[#f0f6fc] line-clamp-2 break-words ${
                                  isDone ? 'line-through text-[#8b949e]' : ''
                                }`}
                                title={task.title || task.taskTitle}
                              >
                                {task.title || task.taskTitle}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8b949e]">
                                <span>⏱️ {task.estimatedMinutes} mins</span>
                                <span>•</span>
                                <span className="truncate">{task.reasonTag || task.reason || 'CBSE Target'}</span>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold shrink-0 mt-0.5 ${
                                isDone ? 'text-[#3fb950]' : 'text-[#8b949e]'
                              }`}
                            >
                              {isDone ? '+25 XP' : `${task.estimatedMinutes}m`}
                            </span>
                          </div>
                        );
                      })}

                      {/* Sync to Calendar status & action button */}
                      {(() => {
                        const syncedCount = todayDailyPlan.tasks.filter(t =>
                          (activeProfile?.calendarBlocks || []).some(
                            b =>
                              b.date === todayStr &&
                              (b.id === t.id ||
                                b.id === `blk_${t.id}` ||
                                (b.subject === t.subject &&
                                  ((t.chapterId && b.chapterId === t.chapterId) ||
                                    (t.chapterName && b.chapterName === t.chapterName) ||
                                    b.title === (t.title || t.taskTitle))))
                          )
                        ).length;
                        const allSynced = syncedCount === todayDailyPlan.tasks.length;

                        return (
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() => handleSyncPlanToCalendar(todayDailyPlan.tasks)}
                              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-all ${
                                allSynced
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'border-[#58a6ff]/40 bg-[#58a6ff]/10 text-[#58a6ff] hover:bg-[#58a6ff]/20'
                              }`}
                            >
                              {allSynced ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                              <span>
                                {allSynced
                                  ? `Synced with Calendar (${syncedCount}/${todayDailyPlan.tasks.length})`
                                  : `Sync Plan to Calendar (${todayDailyPlan.tasks.length - syncedCount} pending)`}
                              </span>
                            </button>
                            {allSynced && (
                              <button
                                onClick={() => setActiveTab('planner')}
                                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#8b949e] hover:text-[#f0f6fc] hover:bg-white/[0.08]"
                                title="Open Calendar Planner"
                              >
                                View
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getSmartFocusItems().map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleCycleStage(item.subject, item.chapterId, item.stageIdx)}
                          className={`habit-item cursor-pointer ${item.isProgress ? 'done' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={item.isProgress}
                            onChange={() => {}}
                            className="h-4 w-4 rounded accent-[#238636] pointer-events-none"
                          />
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${SUBJECT_COLORS[item.subject]?.accent || '#58a6ff'}18`,
                                  color: SUBJECT_COLORS[item.subject]?.accent || '#58a6ff'
                                }}
                              >
                                {item.subject}
                              </span>
                            </div>
                            <div className="text-xs font-medium leading-snug text-[#f0f6fc] line-clamp-2 break-words">
                              {item.chapterName}
                            </div>
                            <div className="mt-0.5 text-[10px] text-[#8b949e] truncate">
                              {item.stageName}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold shrink-0 ${item.isProgress ? 'text-[#3fb950]' : 'text-[#8b949e]'}`}>
                            {item.isProgress ? '+15 XP' : 'Pending'}
                          </span>
                        </div>
                      ))}

                      <button
                        onClick={() => setShowDailyPlanModal(true)}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#58a6ff] to-[#388bfd] py-2 text-xs font-bold text-[#0b0f19] hover:brightness-110"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate Today's Plan (4-7 Tasks)
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const focus = getSmartFocusItems()[0];
                      if (focus) {
                        setTargetSubjectForSession(focus.subject);
                      }
                      setActiveTab('sessions');
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#58a6ff] py-2.5 text-xs font-bold text-[#0b0f19] transition-all hover:bg-sky-400"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Start Study Session Now
                  </button>
                </div>

                {/* Bento Card 2: Sleep Monitor */}
                <div className="bento-card">
                  <div className="flex items-center justify-between">
                    <div className="card-title m-0">
                      <span>🌙</span>
                      <span>Sleep Monitor</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('sleep')}
                      className="text-xs font-bold text-[#58a6ff] hover:underline"
                    >
                      {todaySleepLog ? 'Details' : '+ Log'}
                    </button>
                  </div>

                  <div className="my-3">
                    <div className="sleep-circle">
                      <div className="text-center">
                        <div className="text-2xl font-black text-[#f0f6fc]">
                          {todaySleepLog ? todaySleepLog.hours : '7.5'}
                        </div>
                        <div className="text-[10px] text-[#8b949e]">Hours</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-xs text-[#8b949e]">
                    {todaySleepLog ? (
                      <span>Quality: <span className="font-bold text-[#f0f6fc] capitalize">{todaySleepLog.quality}</span> • Recommended: 8h</span>
                    ) : (
                      <span>Recommended: 8h • Log last night's rest</span>
                    )}
                  </div>

                  {!todaySleepLog && (
                    <button
                      onClick={() => setActiveTab('sleep')}
                      className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs font-bold text-[#58a6ff] hover:bg-white/[0.06]"
                    >
                      Log Rest Hours
                    </button>
                  )}
                </div>

                {/* Bento Card 3: Mistake Journal Quick Card */}
                <div className="bento-card">
                  <div className="flex items-center justify-between">
                    <div className="card-title m-0">
                      <span>⚠️</span>
                      <span>Mistake Journal</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('mistakes')}
                      className="text-xs font-bold text-[#58a6ff] hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[#8b949e]">
                    {unresolvedMistakesCount > 0
                      ? `${unresolvedMistakesCount} unresolved mistake${unresolvedMistakesCount === 1 ? '' : 's'} boosting chapter priorities.`
                      : 'All mistakes resolved! Keep logging tricky test questions.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('mistakes')}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs font-bold text-[#f0f6fc] transition-colors hover:border-[#f85149]/40 hover:text-[#f85149]"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-[#d29922]" />
                    Open Mistake Journal ({unresolvedMistakesCount}) →
                  </button>
                </div>

                {/* Bento Card 4: Time Blocking Calendar Quick Card */}
                <div className="bento-card">
                  <div className="flex items-center justify-between">
                    <div className="card-title m-0">
                      <span>🗓️</span>
                      <span>Calendar Planner</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('planner')}
                      className="text-xs font-bold text-[#58a6ff] hover:underline"
                    >
                      Planner
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[#8b949e]">
                    {todayBlocksCount > 0
                      ? `${todayBlocksCount} time block${todayBlocksCount === 1 ? '' : 's'} scheduled for today.`
                      : 'Drag & schedule study time blocks across weekly slots.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('planner')}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs font-bold text-[#f0f6fc] transition-colors hover:border-[#58a6ff]/40 hover:text-[#58a6ff]"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#58a6ff]" />
                    Open Weekly Calendar ({todayBlocksCount} blocks) →
                  </button>
                </div>

                {/* Bento Card 5: Daily Subject Habits */}
                <div className="bento-card">
                  <div className="flex items-center justify-between">
                    <div className="card-title m-0">
                      <span>⚡</span>
                      <span>Daily Subject Habits</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('sessions')}
                      className="text-xs font-bold text-[#58a6ff] hover:underline"
                    >
                      Checklist
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[#8b949e]">
                    Maintain daily NCERT revision, formulas, and 5 HOTS questions.
                  </p>
                  <button
                    onClick={() => setActiveTab('sessions')}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs font-bold text-[#f0f6fc] transition-colors hover:border-[#58a6ff]/40 hover:text-[#58a6ff]"
                  >
                    <CheckSquare className="h-3.5 w-3.5 text-[#3fb950]" />
                    Open Habits Tracker →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TIME BLOCKING CALENDAR / PLANNER (FEATURE 2) */}
        {activeTab === 'planner' && activeProfile && (
          <TimeBlockingCalendar
            profile={activeProfile}
            initialDateStr={plannerTargetDate}
            highlightedBlockId={highlightedBlockId}
            onAddBlock={handleAddCalendarBlock}
            onDeleteBlock={handleDeleteCalendarBlock}
            onUpdateBlock={handleUpdateCalendarBlock}
            onAddSession={handleAddSession}
            onOpenDailyPlan={() => setShowDailyPlanModal(true)}
            onToggleDailyTask={handleToggleDailyTask}
            onSyncPlanToCalendar={handleSyncPlanToCalendar}
          />
        )}

        {/* TAB 3: CHAPTERS VIEW (FEATURE 3 & DIFFICULTY TAGS) */}
        {activeTab === 'chapters' && activeProfile && (
          <ChaptersView
            profile={activeProfile}
            initialSubject={targetSubjectForChapters}
            onCycleStage={handleCycleStage}
            onMarkAllDone={handleMarkAllDone}
            onResetStages={handleResetStages}
            onCutChapter={handleCutChapter}
            onRenameChapter={handleRenameChapter}
            onAddChapter={handleAddChapter}
            onRestoreCBSE={handleRestoreCBSE}
            onToggleDifficulty={handleToggleDifficulty}
            onAddToTodayPlan={handleAddStageToTodayPlan}
            onAddToWeeklyPlan={handleAddStageToWeeklyPlan}
            onOpenDailyPlanner={() => setShowDailyPlanModal(true)}
            onNavigateToMistakes={(sub, ch) => {
              setTargetSubjectForMistakes(sub);
              setTargetChapterForMistakes(ch);
              setActiveTab('mistakes');
            }}
          />
        )}

        {/* TAB 4: MISTAKE JOURNAL (FEATURE 5) */}
        {activeTab === 'mistakes' && activeProfile && (
          <MistakeJournal
            profile={activeProfile}
            initialSubject={targetSubjectForMistakes}
            initialChapter={targetChapterForMistakes}
            onAddMistake={handleAddMistake}
            onToggleResolved={handleToggleResolvedMistake}
            onDeleteMistake={handleDeleteMistake}
            onNavigateToChapter={(sub, ch) => {
              setTargetSubjectForChapters(sub);
              setActiveTab('chapters');
            }}
          />
        )}

        {/* TAB 5: STUDY SESSIONS & HABITS (PRIORITY 2) */}
        {activeTab === 'sessions' && activeProfile && (
          <StudySessionsAndHabits
            profile={activeProfile}
            initialSubject={targetSubjectForSession}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        )}

        {/* TAB 6: SLEEP TRACKER (PRIORITY 4) */}
        {activeTab === 'sleep' && activeProfile && (
          <SleepTracker
            profile={activeProfile}
            onSaveSleepLog={handleSaveSleepLog}
            onDeleteSleepLog={handleDeleteSleepLog}
          />
        )}

        {/* TAB 7: WEEKLY TRENDS DASHBOARD (PRIORITY 5) */}
        {activeTab === 'insights' && activeProfile && (
          <WeeklyTrendsDashboard
            profile={activeProfile}
            onNavigateToSubject={sub => {
              setTargetSubjectForChapters(sub);
              setActiveTab('chapters');
            }}
          />
        )}

        {/* TAB 8: RESOURCES & NOTES */}
        {activeTab === 'resources' && activeProfile && (
          <ResourcesView profile={activeProfile} />
        )}

        {/* TAB 9: SETTINGS & DATESHEET */}
        {activeTab === 'settings' && activeProfile && (
          <SettingsView
            profile={activeProfile}
            onUpdateProfile={handleUpdateProfile}
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
            onResetAllData={handleResetAllData}
            onRestoreDefaultChapters={handleRestoreCBSE}
          />
        )}
      </main>

      {/* Auto Daily Plan Generator Modal */}
      {activeProfile && (
        <DailyPlanModal
          profile={activeProfile}
          isOpen={showDailyPlanModal}
          onClose={() => setShowDailyPlanModal(false)}
          onSavePlan={handleSaveDailyPlan}
          onSyncToCalendar={handleSyncPlanToCalendar}
          onEnergyChange={handleSaveEnergyCheckin}
        />
      )}

      {/* Daily Energy Check-in Modal */}
      {activeProfile && (
        <EnergyCheckinModal
          isOpen={showEnergyModal}
          currentEnergy={activeProfile.energyLevel}
          onSelectEnergy={handleSaveEnergyCheckin}
          onClose={() => setShowEnergyModal(false)}
        />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={tab => setActiveTab(tab)} />

      {/* Floating Undo Notification Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-sky-500/40 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xl shadow-black/80 ring-1 ring-white/10">
          <span>{toast.message}</span>
          {toast.undoAction && (
            <button
              onClick={() => {
                toast.undoAction?.();
                setToast(null);
              }}
              className="rounded-full bg-sky-400 px-2.5 py-0.5 text-[11px] font-black text-slate-950 hover:bg-sky-300"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* Setup Wizard for new profiles */}
      {showWizard && (
        <SetupWizard
          onComplete={newProf => {
            setProfiles(prev => [...prev, newProf]);
            setActiveProfileId(newProf.id);
            setShowWizard(false);
            setActiveTab('home');
            showNotification(`Welcome, ${newProf.name}! Profile created! 🎉`);
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
