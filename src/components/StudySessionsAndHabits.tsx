import React, { useState, useEffect } from 'react';
import { UserProfile, SubjectName, StudySession, SubjectHabit } from '../types';
import { SUBJECTS, SUBJECT_COLORS } from '../data/cbseData';
import { Play, Pause, RotateCcw, CheckCircle2, Plus, Trash2, Clock, Flame, Calendar, CheckSquare, Sparkles, BookOpen } from 'lucide-react';

interface StudySessionsAndHabitsProps {
  profile: UserProfile;
  initialSubject?: SubjectName;
  onAddSession: (session: Omit<StudySession, 'id'>) => void;
  onDeleteSession: (sessionId: string) => void;
  onToggleHabit: (habitId: string, dateStr: string) => void;
  onAddHabit: (subject: SubjectName, title: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const StudySessionsAndHabits: React.FC<StudySessionsAndHabitsProps> = ({
  profile,
  initialSubject = 'Mathematics',
  onAddSession,
  onDeleteSession,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit
}) => {
  const [activeSubject, setActiveSubject] = useState<SubjectName>(initialSubject);
  const [activeSubTab, setActiveSubTab] = useState<'timer' | 'habits' | 'history'>('timer');

  // Study Timer state
  const [timerSubject, setTimerSubject] = useState<SubjectName>(initialSubject);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [initialDurationMinutes, setInitialDurationMinutes] = useState<number>(25);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Manual session log state
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualDuration, setManualDuration] = useState<number>(45);
  const [manualNotes, setManualNotes] = useState<string>('');

  // New habit input
  const [newHabitTitle, setNewHabitTitle] = useState<string>('');
  const [showAddHabit, setShowAddHabit] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Sync chapters for timer subject
  useEffect(() => {
    const chapters = profile.subjects[timerSubject]?.chapters || [];
    if (chapters.length > 0 && !selectedChapter) {
      setSelectedChapter(chapters[0].name);
    }
  }, [timerSubject, profile]);

  // Timer interval effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      handleFinishSession();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSetTimerPreset = (minutes: number) => {
    setIsTimerRunning(false);
    setInitialDurationMinutes(minutes);
    setTimerSeconds(minutes * 60);
  };

  const handleFinishSession = () => {
    const elapsedSeconds = initialDurationMinutes * 60 - timerSeconds;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    onAddSession({
      subject: timerSubject,
      chapterName: selectedChapter || 'General Study',
      durationMinutes: elapsedMinutes,
      timestamp: new Date().toISOString(),
      notes: sessionNotes.trim() || undefined
    });

    // Reset timer
    setIsTimerRunning(false);
    setTimerSeconds(initialDurationMinutes * 60);
    setSessionNotes('');
  };

  const handleSaveManualSession = () => {
    if (manualDuration <= 0) return;
    onAddSession({
      subject: timerSubject,
      chapterName: selectedChapter || 'General Revision',
      durationMinutes: manualDuration,
      timestamp: new Date().toISOString(),
      notes: manualNotes.trim() || undefined
    });
    setShowManualModal(false);
    setManualNotes('');
  };

  // Habits for active subject
  const subjectHabits = (profile.habits || []).filter(h => h.subject === activeSubject);
  const completedTodayCount = subjectHabits.filter(h => h.completedDates.includes(todayStr)).length;
  const habitCompletionPercent = subjectHabits.length > 0 ? Math.round((completedTodayCount / subjectHabits.length) * 100) : 0;

  const handleCreateHabit = () => {
    if (!newHabitTitle.trim()) return;
    onAddHabit(activeSubject, newHabitTitle.trim());
    setNewHabitTitle('');
    setShowAddHabit(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="card-title m-0 mb-1">
            <span>⏱️</span>
            <span>Study Sessions & Habit Tracker</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#f0f6fc] sm:text-3xl">
            Focus Timer & Daily Habits
          </h2>
          <p className="text-xs text-[#8b949e] sm:text-sm">
            Track real study focus hours alongside daily subject revision habits.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex rounded-xl border border-white/10 bg-[#161b22] p-1">
          <button
            onClick={() => setActiveSubTab('timer')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'timer'
                ? 'bg-[#58a6ff] text-[#0b0f19]'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Study Timer
          </button>
          <button
            onClick={() => setActiveSubTab('habits')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'habits'
                ? 'bg-[#58a6ff] text-[#0b0f19]'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Subject Habits
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'history'
                ? 'bg-[#58a6ff] text-[#0b0f19]'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Session Logs
          </button>
        </div>
      </div>

      {/* Tab 1: Interactive Study Timer */}
      {activeSubTab === 'timer' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Main Timer Display */}
          <div className="bento-card lg:col-span-7 flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between">
                <div className="card-title m-0">
                  <span>⏳</span>
                  <span>Focus Timer</span>
                </div>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="text-xs font-semibold text-[#58a6ff] hover:underline"
                >
                  + Log Past Session Manually
                </button>
              </div>

              {/* Subject & Chapter Selection */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-[#8b949e]">Target Subject</label>
                  <select
                    value={timerSubject}
                    onChange={e => setTimerSubject(e.target.value as SubjectName)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-3 py-2 text-xs font-bold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                  >
                    {SUBJECTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8b949e]">Chapter / Topic</label>
                  <select
                    value={selectedChapter}
                    onChange={e => setSelectedChapter(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-3 py-2 text-xs font-bold text-[#f0f6fc] outline-none focus:border-[#58a6ff] truncate"
                  >
                    {(profile.subjects[timerSubject]?.chapters || []).map(ch => (
                      <option key={ch.id} value={ch.name}>{ch.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Big Digital Clock Display */}
              <div className="my-8 flex flex-col items-center justify-center">
                <div className="text-6xl font-black tracking-tight text-[#58a6ff] sm:text-7xl font-mono">
                  {formatTimer(timerSeconds)}
                </div>
                <span className="mt-2 text-xs font-bold uppercase tracking-widest text-[#8b949e]">
                  {isTimerRunning ? 'Session In Progress 🔥' : 'Ready to Study'}
                </span>
              </div>

              {/* Presets */}
              <div className="flex justify-center gap-2">
                {[15, 25, 45, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => handleSetTimerPreset(mins)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                      initialDurationMinutes === mins
                        ? 'border-[#58a6ff] bg-[#58a6ff]/20 text-[#58a6ff]'
                        : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                {!isTimerRunning ? (
                  <button
                    onClick={() => setIsTimerRunning(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#58a6ff] py-3 text-sm font-bold text-[#0b0f19] transition-all hover:bg-sky-400"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Start Study Session
                  </button>
                ) : (
                  <button
                    onClick={() => setIsTimerRunning(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d29922] py-3 text-sm font-bold text-[#0b0f19] transition-all hover:bg-amber-400"
                  >
                    <Pause className="h-4 w-4 fill-current" />
                    Pause Session
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(initialDurationMinutes * 60);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]"
                  title="Reset Timer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  onClick={handleFinishSession}
                  className="flex items-center gap-1.5 rounded-xl border border-[#238636]/40 bg-[#238636]/15 px-4 py-3 text-xs font-bold text-[#3fb950] transition-colors hover:bg-[#238636] hover:text-[#f0f6fc]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finish & Log
                </button>
              </div>

              <input
                type="text"
                placeholder="Session notes (e.g. solved 10 NCERT exercises, key formulas revised)"
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b0f19] px-3 py-2 text-xs text-[#f0f6fc] outline-none placeholder:text-[#8b949e]/50 focus:border-[#58a6ff]"
              />
            </div>
          </div>

          {/* Quick Habits & Subject Overview alongside timer */}
          <div className="bento-card lg:col-span-5 flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="card-title m-0">
                  <span>⚡</span>
                  <span>Today's Habits: {timerSubject}</span>
                </div>
                <span className="rounded-full bg-[#58a6ff]/15 px-2.5 py-0.5 text-xs font-bold text-[#58a6ff]">
                  {completedTodayCount} / {subjectHabits.length} Done
                </span>
              </div>
              <p className="mt-1 text-xs text-[#8b949e]">
                Check off revision habits as you complete this study session.
              </p>

              <div className="mt-4 space-y-2">
                {subjectHabits.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-[#8b949e]">
                    No habits set for {timerSubject}. Click "+ Add Habit" below.
                  </div>
                ) : (
                  subjectHabits.map(habit => {
                    const isDone = habit.completedDates.includes(todayStr);
                    return (
                      <div
                        key={habit.id}
                        onClick={() => onToggleHabit(habit.id, todayStr)}
                        className={`habit-item cursor-pointer ${isDone ? 'done' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {}}
                          className="h-4 w-4 rounded accent-[#238636] pointer-events-none"
                        />
                        <span className={`text-xs font-semibold ${isDone ? 'line-through text-[#8b949e]' : 'text-[#f0f6fc]'}`}>
                          {habit.title}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <button
                onClick={() => setActiveSubTab('habits')}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-2 text-xs font-bold text-[#8b949e] transition-colors hover:border-[#58a6ff]/40 hover:text-[#58a6ff]"
              >
                Manage All Subject Habits →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Dedicated Subject Habits Manager */}
      {activeSubTab === 'habits' && (
        <div className="space-y-4">
          {/* Subject Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {SUBJECTS.map(sub => {
              const isActive = sub === activeSubject;
              const habitsForSub = (profile.habits || []).filter(h => h.subject === sub);
              const doneCount = habitsForSub.filter(h => h.completedDates.includes(todayStr));

              return (
                <button
                  key={sub}
                  onClick={() => setActiveSubject(sub)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? 'border-[#58a6ff] bg-[#58a6ff] text-[#0b0f19]'
                      : 'border-white/10 bg-[#161b22] text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]'
                  }`}
                >
                  <span>{sub}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive ? 'bg-[#0b0f19]/20 text-[#0b0f19] font-black' : 'bg-white/10 text-[#8b949e]'
                    }`}
                  >
                    {doneCount.length}/{habitsForSub.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subject Habits Card */}
          <div className="bento-card p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
              <div>
                <div className="card-title m-0">
                  <span>✨</span>
                  <span>Daily Revision Habits: {activeSubject}</span>
                </div>
                <p className="mt-1 text-xs text-[#8b949e]">
                  Track your daily consistency. Completing these daily habits drives top scores in CBSE board exams!
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#3fb950] transition-all duration-300"
                      style={{ width: `${habitCompletionPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#3fb950]">{habitCompletionPercent}%</span>
                </div>

                <button
                  onClick={() => setShowAddHabit(true)}
                  className="flex items-center gap-1 rounded-xl bg-[#58a6ff] px-3 py-1.5 text-xs font-bold text-[#0b0f19] transition-colors hover:bg-sky-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Habit
                </button>
              </div>
            </div>

            {/* Add Habit Form */}
            {showAddHabit && (
              <div className="my-4 rounded-xl border border-white/10 bg-[#0b0f19] p-3">
                <label className="text-xs font-bold text-[#f0f6fc]">
                  New Daily Habit for {activeSubject}
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={newHabitTitle}
                    onChange={e => setNewHabitTitle(e.target.value)}
                    placeholder="e.g. Daily 15m formula recall, 5 numerical problems..."
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                  />
                  <button
                    onClick={handleCreateHabit}
                    className="rounded-xl bg-[#58a6ff] px-4 py-2 text-xs font-bold text-[#0b0f19] hover:bg-sky-400"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowAddHabit(false)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-[#8b949e] hover:bg-white/[0.05]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Habits List */}
            <div className="mt-4 space-y-2">
              {subjectHabits.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-[#8b949e]">
                  No habits configured for {activeSubject} yet. Click "+ Add Habit" above.
                </div>
              ) : (
                subjectHabits.map(habit => {
                  const isDone = habit.completedDates.includes(todayStr);
                  const totalCompletedDays = habit.completedDates.length;

                  return (
                    <div
                      key={habit.id}
                      className={`habit-item group ${isDone ? 'done' : ''}`}
                    >
                      <div
                        onClick={() => onToggleHabit(habit.id, todayStr)}
                        className="flex flex-1 cursor-pointer items-center gap-3"
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {}}
                          className="h-4 w-4 rounded accent-[#238636] pointer-events-none"
                        />
                        <div>
                          <p className={`text-xs font-bold sm:text-sm ${isDone ? 'text-[#8b949e] line-through' : 'text-[#f0f6fc]'}`}>
                            {habit.title}
                          </p>
                          <span className="text-[10px] font-semibold text-[#8b949e]">
                            Completed {totalCompletedDays} times total
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isDone && (
                          <span className="rounded bg-[#238636]/20 px-2 py-0.5 text-[10px] font-bold text-[#3fb950]">
                            Done Today
                          </span>
                        )}
                        <button
                          onClick={() => onDeleteHabit(habit.id)}
                          className="rounded-lg p-1.5 text-[#8b949e] opacity-0 transition-opacity hover:text-[#f85149] group-hover:opacity-100"
                          title="Delete Habit"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Session Logs & History */}
      {activeSubTab === 'history' && (
        <div className="bento-card p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="card-title m-0">
                <span>📋</span>
                <span>Recent Study Sessions</span>
              </div>
              <p className="mt-1 text-xs text-[#8b949e]">
                Log of your student study sessions across all 7 subjects.
              </p>
            </div>
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#58a6ff] px-3 py-1.5 text-xs font-bold text-[#0b0f19] hover:bg-sky-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Session
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {(!profile.sessions || profile.sessions.length === 0) ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-[#8b949e]">
                No study sessions logged yet. Start the study timer or log a manual session!
              </div>
            ) : (
              [...profile.sessions]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map(sess => {
                  const sessDate = new Date(sess.timestamp);
                  const dateFormatted = `${sessDate.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short'
                  })} • ${sessDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                  return (
                    <div
                      key={sess.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-white/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#58a6ff]/30 bg-[#58a6ff]/15 font-black text-xs text-[#58a6ff]">
                          {sess.durationMinutes}m
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#f0f6fc]">{sess.subject}</span>
                            <span className="text-[11px] text-[#8b949e]">• {sess.chapterName || 'General'}</span>
                          </div>
                          {sess.notes && (
                            <p className="mt-0.5 text-xs text-[#8b949e] line-clamp-1">{sess.notes}</p>
                          )}
                          <span className="text-[10px] text-[#8b949e]/70">{dateFormatted}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteSession(sess.id)}
                        className="rounded-lg p-2 text-[#8b949e] hover:text-[#f85149]"
                        title="Delete Session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Manual Session Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bento-card w-full max-w-md p-6 shadow-2xl">
            <div className="card-title m-0">
              <span>✍️</span>
              <span>Log Past Study Session</span>
            </div>
            <p className="mt-1 text-xs text-[#8b949e]">Record study time completed offline.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#8b949e]">Subject</label>
                <select
                  value={timerSubject}
                  onChange={e => setTimerSubject(e.target.value as SubjectName)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] p-2.5 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8b949e]">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="360"
                  value={manualDuration}
                  onChange={e => setManualDuration(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] p-2.5 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8b949e]">Chapter / Topic</label>
                <input
                  type="text"
                  value={selectedChapter}
                  onChange={e => setSelectedChapter(e.target.value)}
                  placeholder="e.g. Real Numbers NCERT Exercise 1.2"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] p-2.5 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8b949e]">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                  placeholder="What was completed during this study session?"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] p-2.5 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowManualModal(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-xs font-bold text-[#8b949e] hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManualSession}
                className="flex-1 rounded-xl bg-[#58a6ff] py-2.5 text-xs font-bold text-[#0b0f19] hover:bg-sky-400"
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
