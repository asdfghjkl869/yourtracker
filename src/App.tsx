import React, { useState, useEffect } from 'react';
import { UserProfile, SubjectName, TabType, StudySession, DailySleepLog, Chapter } from './types';
import { SUBJECTS, generateSampleInitialProfile, DEFAULT_STAGES, SYLLABUS_DATA } from './data/cbseData';
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
import { Sparkles, Play, Moon, CheckSquare, Zap, BookOpen, Flame } from 'lucide-react';

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
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[subject];
          if (!subData) return p;
          const updatedChapters = subData.chapters.map(ch => {
            if (ch.id === chapterId) {
              const current = ch.stageStates[stageIdx] || 0;
              const next = (current + 1) % 3;
              const newStates = [...ch.stageStates];
              newStates[stageIdx] = next;
              return { ...ch, stageStates: newStates };
            }
            return ch;
          });
          return {
            ...p,
            subjects: {
              ...p.subjects,
              [subject]: { ...subData, chapters: updatedChapters }
            }
          };
        }
        return p;
      })
    );
  };

  const handleMarkAllDone = (subject: SubjectName, chapterId: string) => {
    if (!activeProfile) return;
    const stages = activeProfile.customStages[subject] || DEFAULT_STAGES[subject];
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[subject];
          if (!subData) return p;
          const updated = subData.chapters.map(ch => {
            if (ch.id === chapterId) {
              return { ...ch, stageStates: stages.map(() => 2) };
            }
            return ch;
          });
          return {
            ...p,
            subjects: { ...p.subjects, [subject]: { ...subData, chapters: updated } }
          };
        }
        return p;
      })
    );
    showNotification(`All stages marked complete! 🚀`);
  };

  const handleResetStages = (subject: SubjectName, chapterId: string) => {
    if (!activeProfile) return;
    const stages = activeProfile.customStages[subject] || DEFAULT_STAGES[subject];
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === activeProfile.id) {
          const subData = p.subjects[subject];
          if (!subData) return p;
          const updated = subData.chapters.map(ch => {
            if (ch.id === chapterId) {
              return { ...ch, stageStates: stages.map(() => 0) };
            }
            return ch;
          });
          return {
            ...p,
            subjects: { ...p.subjects, [subject]: { ...subData, chapters: updated } }
          };
        }
        return p;
      })
    );
    showNotification('Stages reset to pending.');
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

  // Smart Focus items for Today's Focus box (as in screenshots)
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

    // Prioritize In-Progress stages
    for (const sub of SUBJECTS) {
      const subData = activeProfile.subjects[sub];
      if (!subData) continue;
      const stages = activeProfile.customStages[sub] || DEFAULT_STAGES[sub];
      for (const ch of subData.chapters) {
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
            if (items.length >= 3) return items;
          }
        }
      }
    }

    // Then Pending stages
    for (const sub of SUBJECTS) {
      const subData = activeProfile.subjects[sub];
      if (!subData) continue;
      const stages = activeProfile.customStages[sub] || DEFAULT_STAGES[sub];
      for (const ch of subData.chapters) {
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
            if (items.length >= 3) return items;
          }
        }
      }
    }

    return items;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySleepLog = activeProfile?.sleepLogs ? activeProfile.sleepLogs[todayStr] : undefined;

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
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && activeProfile && (
          <div className="space-y-5">
            {/* Student Greeting & Streak (Bento Header) */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#f0f6fc] sm:text-3xl">
                  Hi, {activeProfile.name}!
                </h1>
                <p className="mt-0.5 text-xs font-medium text-[#8b949e] sm:text-sm">
                  {activeProfile.classLevel} Dashboard • Track daily syllabus, habits, and rest
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-full border border-white/10 bg-[#161b22] px-3.5 py-1 text-xs font-semibold text-[#f0f6fc]">
                  Study Streak: <span className="font-bold text-[#d29922]">{activeProfile.streak || 6} Days</span>
                </div>
                <div className="rounded-full bg-[#58a6ff]/15 px-3 py-1 text-xs font-bold text-[#58a6ff]">
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

            {/* Bento Grid: Modular cards for Quest, Sleep, Progress & Habits */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* Left Column: 7 Subject Cards with Visual Progress Bars (Priority 3) */}
              <div className="lg:col-span-8 space-y-4">
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

              {/* Right Column: Bento Modules (Today's Focus Quest, Sleep Monitor, Habits) */}
              <div className="lg:col-span-4 space-y-5">
                {/* Bento Card 1: Day Tracker / Focus Quest */}
                <div className="bento-card">
                  <div className="card-title">
                    <span>📅</span>
                    <span>Day Tracker: Daily Quest</span>
                  </div>
                  <p className="mt-[-6px] mb-3 text-xs text-[#8b949e]">
                    Priority chapters scheduled based on CBSE datesheet pace.
                  </p>

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
                          <div className="text-xs font-bold text-[#f0f6fc] truncate">
                            {item.subject} • {item.chapterName.split(':')[0] || item.chapterName}
                          </div>
                          <div className="text-[11px] text-[#8b949e] truncate">
                            {item.stageName}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold shrink-0 ${item.isProgress ? 'text-[#3fb950]' : 'text-[#8b949e]'}`}>
                          {item.isProgress ? '+15 XP' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const focus = getSmartFocusItems()[0];
                      if (focus) {
                        setTargetSubjectForSession(focus.subject);
                      }
                      setActiveTab('sessions');
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#58a6ff] py-2.5 text-xs font-bold text-[#0b0f19] transition-all hover:bg-sky-400"
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

                {/* Bento Card 3: Daily Subject Habits */}
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

        {/* TAB 2: CHAPTERS VIEW */}
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
          />
        )}

        {/* TAB 3: STUDY SESSIONS & HABITS (PRIORITY 2) */}
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

        {/* TAB 4: SLEEP TRACKER (PRIORITY 4) */}
        {activeTab === 'sleep' && activeProfile && (
          <SleepTracker
            profile={activeProfile}
            onSaveSleepLog={handleSaveSleepLog}
            onDeleteSleepLog={handleDeleteSleepLog}
          />
        )}

        {/* TAB 5: WEEKLY TRENDS DASHBOARD (PRIORITY 5) */}
        {activeTab === 'insights' && activeProfile && (
          <WeeklyTrendsDashboard
            profile={activeProfile}
            onNavigateToSubject={sub => {
              setTargetSubjectForChapters(sub);
              setActiveTab('chapters');
            }}
          />
        )}

        {/* TAB 6: RESOURCES & NOTES */}
        {activeTab === 'resources' && activeProfile && (
          <ResourcesView profile={activeProfile} />
        )}

        {/* TAB 7: SETTINGS & DATESHEET */}
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
