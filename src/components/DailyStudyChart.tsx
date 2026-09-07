import React, { useState } from 'react';
import { UserProfile, SubjectName } from '../types';
import { SUBJECTS, SUBJECT_COLORS } from '../data/cbseData';
import { formatDateIndian } from '../utils/helpers';
import { ChevronLeft, ChevronRight, BarChart3, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface DailyStudyChartProps {
  profile: UserProfile;
  initialDateStr?: string;
  onSelectDate?: (dateStr: string) => void;
}

export const DailyStudyChart: React.FC<DailyStudyChartProps> = ({
  profile,
  initialDateStr,
  onSelectDate
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(initialDateStr || todayStr);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const newStr = d.toISOString().split('T')[0];
    setSelectedDate(newStr);
    onSelectDate?.(newStr);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const newStr = d.toISOString().split('T')[0];
    setSelectedDate(newStr);
    onSelectDate?.(newStr);
  };

  const handleSetToday = () => {
    setSelectedDate(todayStr);
    onSelectDate?.(todayStr);
  };

  // 1. Planned study minutes: Combine calendar blocks and generated daily plan tasks
  const plannedBlocks = (profile.calendarBlocks || []).filter(b => b.date === selectedDate);
  const dayPlan = profile.dailyPlans?.[selectedDate];
  const dailyTasks = dayPlan?.tasks || [];

  const plannedBySubject: Record<string, number> = {};

  // Add minutes from calendar blocks
  plannedBlocks.forEach(b => {
    const [sh, sm] = b.startTime.split(':').map(Number);
    const [eh, em] = b.endTime.split(':').map(Number);
    const dur = (eh * 60 + em) - (sh * 60 + sm);
    const mins = dur > 0 ? dur : 60;
    plannedBySubject[b.subject] = (plannedBySubject[b.subject] || 0) + mins;
  });

  // Add minutes from daily plan tasks not already mirrored in calendar blocks
  dailyTasks.forEach(t => {
    const isAlreadyInBlocks = plannedBlocks.some(b =>
      b.id === t.id ||
      b.id === `blk_${t.id}` ||
      (b.subject === t.subject &&
        ((t.chapterName && b.chapterName === t.chapterName) ||
          b.title === (t.title || t.taskTitle)))
    );
    if (!isAlreadyInBlocks) {
      plannedBySubject[t.subject] = (plannedBySubject[t.subject] || 0) + (t.estimatedMinutes || 45);
    }
  });

  let totalPlannedMinutes = Object.values(plannedBySubject).reduce((sum, v) => sum + v, 0);
  if (dayPlan?.targetTotalMinutes && dayPlan.targetTotalMinutes > totalPlannedMinutes) {
    totalPlannedMinutes = dayPlan.targetTotalMinutes;
  }

  // 2. Actual studied minutes: Combine logged study sessions, completed calendar blocks, and completed quest tasks
  const actualBySubject: Record<string, number> = {};

  // Logged sessions for this date
  const actualSessions = (profile.sessions || []).filter(s =>
    (s.timestamp || s.date || '').startsWith(selectedDate)
  );
  actualSessions.forEach(s => {
    actualBySubject[s.subject] = (actualBySubject[s.subject] || 0) + (s.durationMinutes || 0);
  });

  // Completed calendar blocks (if a session was not already logged for this block)
  plannedBlocks
    .filter(b => b.isCompleted)
    .forEach(b => {
      const hasMatchingSession = actualSessions.some(s =>
        s.subject === b.subject &&
        (s.chapterName === b.chapterName || (b.title && s.notes?.includes(b.title)))
      );
      if (!hasMatchingSession) {
        const [sh, sm] = b.startTime.split(':').map(Number);
        const [eh, em] = b.endTime.split(':').map(Number);
        const dur = (eh * 60 + em) - (sh * 60 + sm);
        const mins = dur > 0 ? dur : 60;
        actualBySubject[b.subject] = (actualBySubject[b.subject] || 0) + mins;
      }
    });

  // Completed daily tasks (if not already counted in blocks or sessions)
  dailyTasks
    .filter(t => t.isCompleted ?? t.completed)
    .forEach(t => {
      const hasMatchingBlock = plannedBlocks.some(b =>
        b.isCompleted &&
        (b.id === t.id ||
          b.id === `blk_${t.id}` ||
          (b.subject === t.subject && b.chapterName === t.chapterName))
      );
      const hasMatchingSession = actualSessions.some(s =>
        s.subject === t.subject && s.chapterName === t.chapterName
      );
      if (!hasMatchingBlock && !hasMatchingSession) {
        actualBySubject[t.subject] = (actualBySubject[t.subject] || 0) + (t.estimatedMinutes || 45);
      }
    });

  const totalActualMinutes = Object.values(actualBySubject).reduce((sum, m) => sum + m, 0);

  const plannedHours = (totalPlannedMinutes / 60).toFixed(1);
  const actualHours = (totalActualMinutes / 60).toFixed(1);
  const progressPercent = totalPlannedMinutes > 0
    ? Math.min(100, Math.round((totalActualMinutes / totalPlannedMinutes) * 100))
    : totalActualMinutes > 0 ? 100 : 0;

  const activeSubjects = Array.from(new Set([...Object.keys(actualBySubject), ...Object.keys(plannedBySubject)]));

  return (
    <div className="bento-card space-y-4">
      {/* Header & Date Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#58a6ff]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
            Daily Study Chart & Day View
          </span>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={handlePrevDay}
            className="rounded-lg border border-white/10 bg-[#161b22] p-1 text-[#8b949e] hover:border-white/20 hover:text-white"
            title="Previous Day"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <span className="px-2 py-0.5 text-xs font-bold text-[#f0f6fc]">
            {selectedDate === todayStr ? 'Today, ' : ''}
            {formatDateIndian(selectedDate)}
          </span>

          <button
            onClick={handleNextDay}
            className="rounded-lg border border-white/10 bg-[#161b22] p-1 text-[#8b949e] hover:border-white/20 hover:text-white"
            title="Next Day"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {selectedDate !== todayStr && (
            <button
              onClick={handleSetToday}
              className="ml-1 rounded-md bg-[#58a6ff]/20 px-2 py-0.5 text-[10px] font-bold text-[#58a6ff] hover:bg-[#58a6ff]/30"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/5 bg-[#0b0f19] p-3 text-left">
          <div className="text-[10px] font-bold uppercase text-[#8b949e]">Planned Hours</div>
          <div className="text-lg sm:text-xl font-black text-[#58a6ff] mt-0.5">
            {plannedHours} <span className="text-xs font-medium text-[#8b949e]">hrs</span>
          </div>
          <div className="text-[10px] text-[#8b949e] mt-1 truncate">
            {plannedBlocks.length} block{plannedBlocks.length === 1 ? '' : 's'}
            {dailyTasks.length > 0 ? ` · ${dailyTasks.length} quest task${dailyTasks.length === 1 ? '' : 's'}` : ''}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0b0f19] p-3 text-left">
          <div className="text-[10px] font-bold uppercase text-[#8b949e]">Actual Studied</div>
          <div className="text-lg sm:text-xl font-black text-[#3fb950] mt-0.5">
            {actualHours} <span className="text-xs font-medium text-[#8b949e]">hrs</span>
          </div>
          <div className="text-[10px] text-[#8b949e] mt-1 truncate">
            {actualSessions.length} session{actualSessions.length === 1 ? '' : 's'}
            {plannedBlocks.filter(b => b.isCompleted).length > 0
              ? ` · ${plannedBlocks.filter(b => b.isCompleted).length} done`
              : ''}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/5 bg-[#0b0f19] p-3 text-left">
          <div className="text-[10px] font-bold uppercase text-[#8b949e]">Plan Realization</div>
          <div className="text-lg sm:text-xl font-black text-[#f0f6fc] mt-0.5">
            {progressPercent}%
          </div>
          <div className="text-[10px] text-[#8b949e] mt-1 truncate">
            {totalActualMinutes >= totalPlannedMinutes && totalPlannedMinutes > 0
              ? 'Goal Achieved! 🎯'
              : totalPlannedMinutes === 0
              ? totalActualMinutes > 0
                ? 'Study recorded'
                : 'No plans set'
              : `${Math.max(0, Math.round(totalPlannedMinutes - totalActualMinutes))}m remaining`}
          </div>
        </div>
      </div>

      {/* Comparative Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-[11px] font-semibold text-[#8b949e]">Target vs. Realized</span>
          <span className="text-[11px] font-bold text-[#f0f6fc]">
            {totalActualMinutes}m / {totalPlannedMinutes > 0 ? `${totalPlannedMinutes}m` : '0m planned'}
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-[#3fb950] to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Subject Breakdown Stacked Visual & Legend */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">
          Subject Breakdown
        </div>

        {activeSubjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-[#8b949e]">
            No study sessions or calendar blocks for this date.
          </div>
        ) : (
          <div className="space-y-2">
            {/* Multi-color stacked distribution bar */}
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex">
              {activeSubjects.map(sub => {
                const actualMins = actualBySubject[sub] || 0;
                const pct = totalActualMinutes > 0 ? (actualMins / totalActualMinutes) * 100 : 0;
                if (pct <= 0) return null;
                const color = SUBJECT_COLORS[sub as SubjectName]?.accent || '#58a6ff';
                return (
                  <div
                    key={sub}
                    title={`${sub}: ${actualMins} mins (${Math.round(pct)}%)`}
                    style={{ width: `${pct}%`, backgroundColor: color }}
                    className="h-full transition-all"
                  />
                );
              })}
            </div>

            {/* Subject Breakdown Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {activeSubjects.map(sub => {
                const actual = actualBySubject[sub] || 0;
                const planned = plannedBySubject[sub] || 0;
                const color = SUBJECT_COLORS[sub as SubjectName]?.accent || '#58a6ff';

                return (
                  <div
                    key={sub}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0b0f19] px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-bold text-[#f0f6fc] truncate">{sub}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[11px]">
                      <span className="font-bold text-[#3fb950]">{actual}m actual</span>
                      {planned > 0 && (
                        <span className="text-[#8b949e]">/ {planned}m plan</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
