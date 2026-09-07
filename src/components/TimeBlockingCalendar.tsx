import React, { useState, useEffect } from 'react';
import { UserProfile, CalendarBlock, SubjectName, StudySession, DailyTask } from '../types';
import { SUBJECTS, SUBJECT_COLORS } from '../data/cbseData';
import { formatDateIndian, getLocalDateString } from '../utils/helpers';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Sparkles,
  Layers,
  X,
  Play,
  ArrowRight,
  ListTodo,
  CheckSquare,
  Square
} from 'lucide-react';

interface TimeBlockingCalendarProps {
  profile: UserProfile;
  initialDateStr?: string;
  highlightedBlockId?: string;
  onAddBlock: (block: Omit<CalendarBlock, 'id'>) => void;
  onDeleteBlock: (id: string) => void;
  onUpdateBlock: (block: CalendarBlock) => void;
  onAddSession: (session: Omit<StudySession, 'id'>) => void;
  onOpenDailyPlan: () => void;
  onToggleDailyTask?: (taskId: string) => void;
  onSyncPlanToCalendar?: (tasks: DailyTask[]) => void;
}

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export const TimeBlockingCalendar: React.FC<TimeBlockingCalendarProps> = ({
  profile,
  initialDateStr,
  highlightedBlockId,
  onAddBlock,
  onDeleteBlock,
  onUpdateBlock,
  onAddSession,
  onOpenDailyPlan,
  onToggleDailyTask,
  onSyncPlanToCalendar
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (initialDateStr) {
      const parts = initialDateStr.split('-').map(Number);
      if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    return new Date();
  });

  // Block Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState(
    initialDateStr || getLocalDateString(new Date())
  );
  const [blockSubject, setBlockSubject] = useState<SubjectName>('Mathematics');
  const [blockChapter, setBlockChapter] = useState('');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('10:30');

  useEffect(() => {
    if (initialDateStr) {
      const parts = initialDateStr.split('-').map(Number);
      if (parts.length === 3) {
        setCurrentDate(new Date(parts[0], parts[1] - 1, parts[2]));
        setSelectedDateStr(initialDateStr);
      }
    }
  }, [initialDateStr]);

  // Compute Monday of current week (CBSE standard Mon-Sun)
  const getMonday = (d: Date) => {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = date.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const monday = getMonday(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return d;
  });

  const prevWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() - (viewMode === 'week' ? 7 : 1));
    setCurrentDate(next);
  };

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + (viewMode === 'week' ? 7 : 1));
    setCurrentDate(next);
  };

  const todayStr = getLocalDateString(new Date());
  const activeDayStr = getLocalDateString(currentDate);

  const calendarBlocks = profile.calendarBlocks || [];
  const sessions = profile.sessions || [];
  const todayTasks = profile.dailyPlans?.[todayStr]?.tasks || [];

  // Filter items for a specific date
  const getBlocksForDate = (dateStr: string) => {
    return calendarBlocks.filter(b => b.date === dateStr);
  };

  const getSessionsForDate = (dateStr: string) => {
    return sessions.filter(s => s.timestamp.startsWith(dateStr));
  };

  const handleOpenAddModal = (dateStr: string, defaultHour?: number) => {
    setSelectedDateStr(dateStr);
    const startH = defaultHour !== undefined ? String(defaultHour).padStart(2, '0') : '09';
    const endH = defaultHour !== undefined ? String(defaultHour + 1).padStart(2, '0') : '10';
    setBlockStartTime(`${startH}:00`);
    setBlockEndTime(`${endH}:00`);
    const defaultChaps = profile.subjects[blockSubject]?.chapters || [];
    if (defaultChaps[0]) setBlockChapter(defaultChaps[0].name);
    setIsModalOpen(true);
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim()) return;

    onAddBlock({
      date: selectedDateStr,
      startTime: blockStartTime,
      endTime: blockEndTime,
      subject: blockSubject,
      chapterName: blockChapter.trim() || undefined,
      title: blockTitle.trim(),
      isCompleted: false
    });

    setBlockTitle('');
    setIsModalOpen(false);
  };

  const handleMarkBlockAsCompleted = (block: CalendarBlock) => {
    onUpdateBlock({ ...block, isCompleted: !block.isCompleted });

    // Also auto-log as completed study session if marking done
    if (!block.isCompleted) {
      const [sh, sm] = block.startTime.split(':').map(Number);
      const [eh, em] = block.endTime.split(':').map(Number);
      const duration = Math.max(15, (eh * 60 + em) - (sh * 60 + sm));

      onAddSession({
        subject: block.subject,
        chapterName: block.chapterName,
        durationMinutes: duration,
        timestamp: `${block.date}T${block.startTime}:00.000Z`,
        notes: `Completed planned session: ${block.title}`
      });
    }
  };

  // Convert "HH:MM" to minutes from 06:00
  const getTopOffsetMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const minsFrom6 = (h - 6) * 60 + m;
    return Math.max(0, minsFrom6);
  };

  const getDurationMinutes = (startTime: string, endTime: string) => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return Math.max(20, (eh * 60 + em) - (sh * 60 + sm));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="card-title m-0 mb-1">
            <span>🗓️</span>
            <span>Study Timetable & Time Blocking</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#f0f6fc] sm:text-3xl">
            Time Blocking Calendar
          </h2>
          <p className="text-xs text-[#8b949e] sm:text-sm">
            Schedule deep-work slots and compare planned study blocks vs actual completed sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDailyPlan}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Auto Daily Plan
          </button>
          <button
            onClick={() => handleOpenAddModal(activeDayStr)}
            className="flex items-center gap-1.5 rounded-xl bg-[#58a6ff] px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
          >
            <Plus className="h-4 w-4" />
            Schedule Block
          </button>
        </div>
      </div>

      {/* View Switcher and Navigation */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#161b22] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[#8b949e] hover:text-[#f0f6fc]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs font-bold text-[#8b949e] hover:text-[#f0f6fc]"
          >
            Today
          </button>
          <button
            onClick={nextWeek}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[#8b949e] hover:text-[#f0f6fc]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <span className="ml-2 text-xs font-bold text-[#f0f6fc] sm:text-sm">
            {viewMode === 'week'
              ? `${formatDateIndian(getLocalDateString(weekDays[0]))} — ${formatDateIndian(
                  getLocalDateString(weekDays[6])
                )}`
              : formatDateIndian(activeDayStr)}
          </span>
        </div>

        {/* Legend & Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#8b949e]">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm border border-sky-400 bg-sky-400/20" />
              Planned Block
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#238636]" />
              Actual Completed Session
            </span>
          </div>

          <div className="flex rounded-xl border border-white/10 bg-[#0d1117] p-0.5">
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                viewMode === 'week' ? 'bg-[#58a6ff] text-slate-950' : 'text-[#8b949e]'
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                viewMode === 'day' ? 'bg-[#58a6ff] text-slate-950' : 'text-[#8b949e]'
              }`}
            >
              Day View
            </button>
          </div>
        </div>
      </div>

      {/* Today's Daily Quests / Syllabus Tasks Sync Banner */}
      {todayTasks.length > 0 && (
        <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-purple-500/5 to-transparent p-3.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-xs">
                🎯
              </span>
              <div>
                <div className="text-xs font-black text-[#f0f6fc] flex items-center gap-2">
                  <span>Today's Daily Quests ({todayTasks.filter(t => t.completed || t.isCompleted).length}/{todayTasks.length})</span>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Synced with Syllabus</span>
                </div>
                <div className="text-[11px] text-[#8b949e]">
                  Tasks scheduled from your Chapter Syllabus for today
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {(() => {
                const unscheduled = todayTasks.filter(
                  t =>
                    !(t.completed || t.isCompleted) &&
                    !calendarBlocks.some(
                      b =>
                        b.date === todayStr &&
                        (b.id === t.id ||
                          b.id === `blk_${t.id}` ||
                          b.title === (t.title || t.taskTitle) ||
                          (b.chapterName === t.chapterName && b.subject === t.subject))
                    )
                );
                if (unscheduled.length > 0 && onSyncPlanToCalendar) {
                  return (
                    <button
                      type="button"
                      onClick={() => onSyncPlanToCalendar(todayTasks)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 text-xs font-bold text-sky-300 hover:bg-sky-500/25"
                      title="Automatically schedule all unscheduled tasks into open time slots"
                    >
                      <CalendarIcon className="h-3 w-3" />
                      <span>Sync All ({unscheduled.length}) to Calendar</span>
                    </button>
                  );
                }
                return null;
              })()}

              <button
                onClick={onOpenDailyPlan}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-[#8b949e] hover:text-[#f0f6fc] hover:bg-white/[0.08]"
              >
                <Sparkles className="h-3 w-3 text-sky-400" />
                <span>Edit Daily Plan</span>
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {todayTasks.map(task => {
              const isDone = !!(task.completed || task.isCompleted);
              const hasCalendarBlock = calendarBlocks.some(
                b =>
                  b.date === todayStr &&
                  (b.id === task.id ||
                    b.id === `blk_${task.id}` ||
                    b.title === (task.title || task.taskTitle) ||
                    (b.chapterName === task.chapterName && b.subject === task.subject))
              );

              return (
                <div
                  key={task.id}
                  className={`flex items-start justify-between rounded-xl border p-2.5 transition-all gap-2 ${
                    isDone
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-[#0d1117] text-[#f0f6fc]'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleDailyTask?.(task.id)}
                      className="shrink-0 text-[#8b949e] hover:text-[#58a6ff] mt-0.5"
                    >
                      {isDone ? (
                        <CheckSquare className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-sky-400">
                          {task.subject}
                        </span>
                        {hasCalendarBlock && (
                          <span className="text-[9px] text-emerald-400/90 font-semibold">• In Planner</span>
                        )}
                        <span className="text-[10px] text-[#8b949e]">• {task.estimatedMinutes}m</span>
                      </div>
                      <div
                        className={`text-xs font-medium leading-snug text-[#f0f6fc] line-clamp-2 break-words ${
                          isDone ? 'line-through text-[#8b949e]' : ''
                        }`}
                        title={task.taskTitle || task.title}
                      >
                        {task.taskTitle || task.title}
                      </div>
                    </div>
                  </div>

                  {!hasCalendarBlock && !isDone && (
                    <button
                      type="button"
                      onClick={() => {
                        setBlockSubject(task.subject);
                        if (task.chapterName) setBlockChapter(task.chapterName);
                        setBlockTitle(task.title || task.taskTitle || 'Study Session');
                        setSelectedDateStr(todayStr);
                        setIsModalOpen(true);
                      }}
                      className="shrink-0 rounded-lg border border-sky-500/30 bg-sky-500/15 px-2 py-1 text-[10px] font-bold text-sky-300 hover:bg-sky-500/25"
                      title="Schedule this quest into a time slot"
                    >
                      + Slot
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEKLY VIEW */}
      {viewMode === 'week' && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#161b22]">
          <div className="min-w-[720px]">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-[#0d1117] text-center">
              {weekDays.map(d => {
                const dStr = getLocalDateString(d);
                const isToday = dStr === todayStr;
                return (
                  <div
                    key={dStr}
                    onClick={() => {
                      setCurrentDate(d);
                      setViewMode('day');
                    }}
                    className={`cursor-pointer border-r border-white/10 p-2.5 transition-colors hover:bg-white/[0.02] ${
                      isToday ? 'bg-sky-500/10' : ''
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase text-[#8b949e]">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div
                      className={`text-sm font-black ${
                        isToday ? 'text-[#58a6ff]' : 'text-[#f0f6fc]'
                      }`}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Days Columns */}
            <div className="grid grid-cols-7 min-h-[480px]">
              {weekDays.map(d => {
                const dStr = getLocalDateString(d);
                const dayBlocks = getBlocksForDate(dStr);
                const daySessions = getSessionsForDate(dStr);
                const isToday = dStr === todayStr;

                return (
                  <div
                    key={dStr}
                    className={`border-r border-white/10 p-2 space-y-2 flex flex-col ${
                      isToday ? 'bg-sky-500/[0.03]' : ''
                    }`}
                  >
                    {/* Planned Blocks */}
                    {dayBlocks.map(b => {
                      const isHighlighted = highlightedBlockId === b.id;
                      const color = SUBJECT_COLORS[b.subject] || {
                        accent: '#38bdf8',
                        bg: 'bg-sky-500/10',
                        text: 'text-sky-400'
                      };

                      return (
                        <div
                          key={b.id}
                          className={`relative rounded-xl border p-2.5 transition-all text-left group ${
                            isHighlighted
                              ? 'ring-2 ring-[#58a6ff] bg-[#58a6ff]/20 animate-pulse border-[#58a6ff] shadow-lg shadow-[#58a6ff]/30'
                              : b.isCompleted
                              ? 'border-emerald-500/40 bg-emerald-500/15'
                              : 'border-white/10 bg-[#0d1117] hover:border-white/20'
                          }`}
                          style={{
                            borderLeftWidth: '4px',
                            borderLeftColor: color.accent
                          }}
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                            <span className="font-semibold">
                              {b.startTime} - {b.endTime}
                            </span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onDeleteBlock(b.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition-opacity"
                              title="Delete block"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          <div
                            className={`mt-1 text-[11px] font-medium leading-snug text-[#f0f6fc] line-clamp-2 break-words ${
                              b.isCompleted ? 'line-through text-[#8b949e]' : ''
                            }`}
                            title={b.title}
                          >
                            {b.title}
                          </div>

                          <div
                            className="mt-0.5 text-[10px] text-[#8b949e] truncate"
                            title={`${b.subject}${b.chapterName ? ` • ${b.chapterName}` : ''}`}
                          >
                            <span className="font-semibold" style={{ color: color.accent }}>{b.subject}</span>
                            {b.chapterName ? <span> • {b.chapterName}</span> : ''}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <button
                              onClick={() => handleMarkBlockAsCompleted(b)}
                              className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                                b.isCompleted
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'border border-white/10 text-[#8b949e] hover:text-[#f0f6fc]'
                              }`}
                            >
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              {b.isCompleted ? 'Done' : 'Mark Done'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Completed Actual Sessions */}
                    {daySessions.map(s => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-left"
                      >
                        <div className="flex items-center justify-between text-[9px] font-bold text-emerald-400">
                          <span>✓ Logged Session</span>
                          <span>{s.durationMinutes}m</span>
                        </div>
                        <div className="text-xs font-bold text-[#f0f6fc] truncate mt-0.5">
                          {s.subject}
                        </div>
                        {s.chapterName && (
                          <div className="text-[10px] text-[#8b949e] truncate">
                            {s.chapterName}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Quick Add Button at bottom of day */}
                    <button
                      onClick={() => handleOpenAddModal(dStr)}
                      className="mt-auto flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-white/10 p-2 text-[10px] font-bold text-[#8b949e] hover:border-white/30 hover:text-[#f0f6fc]"
                    >
                      <Plus className="h-3 w-3" />
                      Add Block
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DAY VIEW (Hour-by-hour side by side: Planned vs Actual) */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Hour Timeline Column */}
            <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-[#161b22] p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
                  Hour-by-Hour Schedule for {formatDateIndian(activeDayStr)}
                </span>
                <span className="text-xs font-semibold text-[#58a6ff]">
                  Click any hour slot to schedule
                </span>
              </div>

              <div className="space-y-1">
                {HOURS.map(hour => {
                  const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                  const nextHourLabel = `${String(hour + 1).padStart(2, '0')}:00`;

                  // Find blocks that overlap with this hour
                  const blocksInHour = getBlocksForDate(activeDayStr).filter(b => {
                    return b.startTime.startsWith(String(hour).padStart(2, '0'));
                  });

                  // Find completed sessions in this hour
                  const sessionsInHour = getSessionsForDate(activeDayStr).filter(s => {
                    const sessTime = s.timestamp.split('T')[1] || '';
                    return sessTime.startsWith(String(hour).padStart(2, '0'));
                  });

                  return (
                    <div
                      key={hour}
                      className="flex items-start gap-3 border-t border-white/5 py-2.5 hover:bg-white/[0.01] transition-colors"
                    >
                      <div className="w-14 shrink-0 text-right text-xs font-bold text-[#8b949e] pt-1">
                        {hourLabel}
                      </div>

                      <div className="flex-1 space-y-2 min-h-[36px]">
                        {blocksInHour.length === 0 && sessionsInHour.length === 0 ? (
                          <div
                            onClick={() => handleOpenAddModal(activeDayStr, hour)}
                            className="cursor-pointer rounded-xl border border-dashed border-white/5 p-2 text-xs text-[#8b949e]/40 hover:border-white/20 hover:text-[#8b949e]"
                          >
                            + Empty slot (click to schedule {hourLabel})
                          </div>
                        ) : (
                          <>
                            {blocksInHour.map(b => (
                              <div
                                key={b.id}
                                className={`flex items-center justify-between rounded-xl border p-3 ${
                                  b.isCompleted
                                    ? 'border-emerald-500/40 bg-emerald-500/10'
                                    : 'border-sky-500/30 bg-sky-500/5'
                                }`}
                              >
                                <div className="flex-1 min-w-0 pr-3">
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span
                                      className={`text-xs font-medium leading-snug text-[#f0f6fc] line-clamp-2 break-words ${
                                        b.isCompleted ? 'line-through text-[#8b949e]' : ''
                                      }`}
                                      title={b.title}
                                    >
                                      {b.title}
                                    </span>
                                    <span className="rounded bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 text-[9px] font-bold text-[#58a6ff] shrink-0">
                                      {b.subject}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#8b949e]">
                                    <span className="font-mono">{b.startTime} - {b.endTime}</span>
                                    {b.chapterName && <span> • {b.chapterName}</span>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleMarkBlockAsCompleted(b)}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                                      b.isCompleted
                                        ? 'bg-emerald-500 text-slate-950'
                                        : 'border border-white/10 text-[#8b949e] hover:text-white'
                                    }`}
                                  >
                                    {b.isCompleted ? '✓ Completed' : 'Mark Done'}
                                  </button>
                                  <button
                                    onClick={() => onDeleteBlock(b.id)}
                                    className="text-[#8b949e] hover:text-rose-400 p-1"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {sessionsInHour.map(s => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-[#f0f6fc]"
                              >
                                <span className="flex items-center gap-2 font-bold">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  Actual Study: {s.subject} ({s.durationMinutes} mins)
                                </span>
                                <span className="text-[10px] text-[#8b949e]">
                                  {s.chapterName || 'General'}
                                </span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day Summary & Gap Detector */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bento-card">
                <div className="card-title">
                  <span>📊</span>
                  <span>Day Alignment & Gaps</span>
                </div>
                <div className="space-y-3 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8b949e]">Planned Study Time:</span>
                    <span className="font-bold text-[#f0f6fc]">
                      {getBlocksForDate(activeDayStr).reduce(
                        (acc, b) => acc + getDurationMinutes(b.startTime, b.endTime),
                        0
                      )}{' '}
                      mins
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#8b949e]">Actual Logged Study:</span>
                    <span className="font-bold text-[#3fb950]">
                      {getSessionsForDate(activeDayStr).reduce(
                        (acc, s) => acc + (s.durationMinutes || 0),
                        0
                      )}{' '}
                      mins
                    </span>
                  </div>

                  <div className="h-px bg-white/10 my-2" />

                  <p className="text-xs text-[#8b949e]">
                    Tip: Maintain 30-minute buffer breaks between heavy Math & Science blocks for mental stamina.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Block Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1117] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-[#f0f6fc]">Schedule Study Block</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8b949e] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8b949e]">Date</label>
                  <input
                    type="date"
                    required
                    value={selectedDateStr}
                    onChange={e => setSelectedDateStr(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-[#161b22] px-3 py-2 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8b949e]">Subject</label>
                  <select
                    value={blockSubject}
                    onChange={e => {
                      const s = e.target.value as SubjectName;
                      setBlockSubject(s);
                      const chs = profile.subjects[s]?.chapters || [];
                      if (chs[0]) setBlockChapter(chs[0].name);
                    }}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-[#161b22] px-3 py-2 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                  >
                    {SUBJECTS.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#8b949e]">Chapter</label>
                <select
                  value={blockChapter}
                  onChange={e => setBlockChapter(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-white/10 bg-[#161b22] px-3 py-2 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                >
                  {(profile.subjects[blockSubject]?.chapters || []).map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="Sample Paper Revision">Sample Paper / Mock</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#8b949e]">Block Goal</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solve Trigonometry ML Agarwal HOTS (1-10)"
                  value={blockTitle}
                  onChange={e => setBlockTitle(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-white/10 bg-[#161b22] px-3 py-2 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8b949e]">Start Time</label>
                  <input
                    type="time"
                    required
                    value={blockStartTime}
                    onChange={e => setBlockStartTime(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-[#161b22] px-3 py-2 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8b949e]">End Time</label>
                  <input
                    type="time"
                    required
                    value={blockEndTime}
                    onChange={e => setBlockEndTime(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-[#161b22] px-3 py-2 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs text-[#8b949e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#58a6ff] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
                >
                  Save to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
