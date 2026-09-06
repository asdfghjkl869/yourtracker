import React, { useState } from 'react';
import { UserProfile, SubjectName } from '../types';
import { calculateWeeklyTrends, calculateOverallStats, calculateSubjectStats } from '../utils/helpers';
import { SUBJECTS, SUBJECT_COLORS } from '../data/cbseData';
import { BarChart3, TrendingUp, Moon, Clock, CheckSquare, Award, Sparkles, BookOpen, Layers } from 'lucide-react';

interface WeeklyTrendsDashboardProps {
  profile: UserProfile;
  onNavigateToSubject?: (subject: SubjectName) => void;
}

export const WeeklyTrendsDashboard: React.FC<WeeklyTrendsDashboardProps> = ({
  profile,
  onNavigateToSubject
}) => {
  const trends = calculateWeeklyTrends(profile);
  const overall = calculateOverallStats(profile);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default to today (last item)

  const selectedDay = trends.days[selectedDayIndex] || trends.days[trends.days.length - 1];

  // Maximum study hours for scaling bar chart (at least 6h for clean proportions)
  const maxStudyHours = Math.max(6, ...trends.days.map(d => d.studyHours));

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <div className="card-title m-0 mb-1">
          <span>📊</span>
          <span>Weekly Momentum & Trends</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-[#f0f6fc] sm:text-3xl">
          Weekly Study & Rest Performance
        </h2>
        <p className="text-xs text-[#8b949e] sm:text-sm">
          Visualize your 7-day study momentum, sleep balance, and subject coverage.
        </p>
      </div>

      {/* Top 4 Metric Bento KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Metric 1: Total Study Hours */}
        <div className="bento-card p-4">
          <div className="flex items-center justify-between text-[#8b949e]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Weekly Study</span>
            <Clock className="h-4 w-4 text-[#58a6ff]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#f0f6fc] sm:text-3xl">
              {trends.totalStudyHours}
            </span>
            <span className="text-xs font-bold text-[#8b949e]">hours</span>
          </div>
          <span className="mt-1 block text-[11px] text-[#58a6ff] font-semibold">
            Avg {trends.avgDailyStudyHours}h / day
          </span>
        </div>

        {/* Metric 2: Sleep Average */}
        <div className="bento-card p-4">
          <div className="flex items-center justify-between text-[#8b949e]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Rest</span>
            <Moon className="h-4 w-4 text-[#d29922]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#f0f6fc] sm:text-3xl">
              {trends.avgDailySleepHours}
            </span>
            <span className="text-xs font-bold text-[#8b949e]">hrs/night</span>
          </div>
          <span className="mt-1 block text-[11px] text-[#d29922] font-semibold">
            {trends.avgDailySleepHours >= 7 ? 'Optimal Recovery' : 'Aim for 7-8h'}
          </span>
        </div>

        {/* Metric 3: Habits Rate */}
        <div className="bento-card p-4">
          <div className="flex items-center justify-between text-[#8b949e]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Habits Done</span>
            <CheckSquare className="h-4 w-4 text-[#238636]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#f0f6fc] sm:text-3xl">
              {trends.habitCompletionRate}%
            </span>
          </div>
          <span className="mt-1 block text-[11px] text-[#3fb950] font-semibold">
            {trends.totalHabitsCompleted} habits logged
          </span>
        </div>

        {/* Metric 4: Overall Stages Done */}
        <div className="bento-card p-4">
          <div className="flex items-center justify-between text-[#8b949e]">
            <span className="text-[11px] font-bold uppercase tracking-wider">CBSE Stages</span>
            <Layers className="h-4 w-4 text-[#58a6ff]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#f0f6fc] sm:text-3xl">
              {overall.percent}%
            </span>
          </div>
          <span className="mt-1 block text-[11px] text-[#58a6ff] font-semibold">
            {overall.doneStages}/{overall.totalStages} stages completed
          </span>
        </div>
      </div>

      {/* 7-Day Study Hours Visual Bento Trend Chart */}
      <div className="bento-card p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="card-title m-0">
              <span>📊</span>
              <span>Weekly Momentum</span>
            </div>
            <p className="mt-1 text-xs text-[#8b949e]">
              Tap any column to inspect study duration, sleep hours, and completed habits.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-[#8b949e]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#58a6ff]" />
              Study Hours
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#d29922]" />
              Sleep Hours
            </span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="mt-6 flex h-52 items-end justify-between gap-2 border-b border-white/10 pb-3 pt-6 sm:gap-4">
          {trends.days.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const studyHeightPercent = Math.min(100, Math.round((day.studyHours / maxStudyHours) * 100));
            const sleepHeightPercent = Math.min(100, Math.round((day.sleepHours / 12) * 100));

            return (
              <div
                key={day.dateStr}
                onClick={() => setSelectedDayIndex(idx)}
                className="group flex flex-1 cursor-pointer flex-col items-center justify-end gap-1.5 transition-all"
              >
                {/* Floating value */}
                <span
                  className={`text-[10px] font-bold transition-colors ${
                    isSelected ? 'text-[#58a6ff]' : 'text-[#8b949e] group-hover:text-[#f0f6fc]'
                  }`}
                >
                  {day.studyHours}h
                </span>

                {/* Dual Bars: Study & Sleep */}
                <div className="flex w-full max-w-[48px] items-end justify-center gap-1">
                  {/* Study Bar */}
                  <div
                    className={`trend-bar ${isSelected ? 'active opacity-100' : ''}`}
                    style={{ height: `${Math.max(8, studyHeightPercent * 1.4)}px` }}
                  />
                  {/* Sleep Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#d29922] opacity-100'
                        : 'bg-[#d29922] opacity-35 group-hover:opacity-80'
                    }`}
                    style={{ height: `${Math.max(8, sleepHeightPercent * 1.2)}px` }}
                  />
                </div>

                {/* Day Label */}
                <span
                  className={`mt-1 text-xs font-bold transition-colors ${
                    isSelected ? 'text-[#58a6ff]' : 'text-[#8b949e]'
                  }`}
                >
                  {day.dayLabel}
                </span>
                <span className="hidden text-[9px] text-[#8b949e] sm:inline">
                  {day.fullDate}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Day Detailed Breakdown Inspector */}
        {selectedDay && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#58a6ff]/30 bg-[#58a6ff]/5 p-3.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#58a6ff] px-2 py-0.5 font-bold text-[#0b0f19]">
                {selectedDay.dayLabel}, {selectedDay.fullDate}
              </span>
              <span className="font-semibold text-[#f0f6fc]">
                Studied {selectedDay.studyHours} hours ({selectedDay.studyMinutes}m)
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#8b949e]">
              <span>
                🌙 Sleep: <strong className="text-[#d29922]">{selectedDay.sleepHours} hrs</strong>
              </span>
              <span>
                ✓ Habits: <strong className="text-[#3fb950]">{selectedDay.habitsCompleted}</strong> done
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Subject Study Hours Distribution + Stage Completion Breakdown */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Subject Study Hours Distribution this week */}
        <div className="bento-card lg:col-span-6 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="card-title m-0">
              <span>📚</span>
              <span>Subject Study Distribution (7 Days)</span>
            </div>
            <span className="text-xs font-bold text-[#58a6ff]">
              {trends.totalStudyHours} hrs total
            </span>
          </div>
          <p className="mt-1 text-xs text-[#8b949e]">
            Time allocated across CBSE subjects this week.
          </p>

          <div className="mt-5 space-y-3">
            {trends.subjectBreakdown.map(item => {
              return (
                <div
                  key={item.subject}
                  onClick={() => onNavigateToSubject && onNavigateToSubject(item.subject)}
                  className="cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff]">
                      {item.subject}
                    </span>
                    <span className="text-[#8b949e] font-bold">
                      {item.hours}h ({item.percentage}%)
                    </span>
                  </div>
                  <div className="progress-bar-container mt-1.5 h-1.5">
                    <div
                      className="progress-fill bg-[#58a6ff]"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall CBSE Subject Stage Progress (from user's original insights) */}
        <div className="bento-card lg:col-span-6 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="card-title m-0">
              <span>🎯</span>
              <span>Syllabus Stage Completion</span>
            </div>
            <span className="text-xs font-bold text-[#3fb950]">
              {overall.doneStages} / {overall.totalStages} Stages Done
            </span>
          </div>
          <p className="mt-1 text-xs text-[#8b949e]">
            Comprehensive stage progress across each of the 7 core CBSE subjects.
          </p>

          <div className="mt-5 space-y-3.5">
            {SUBJECTS.map(sub => {
              const stats = calculateSubjectStats(profile, sub);
              return (
                <div
                  key={sub}
                  onClick={() => onNavigateToSubject && onNavigateToSubject(sub)}
                  className="cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff]">
                      {sub}
                    </span>
                    <span className="font-bold text-[#8b949e]">
                      {stats.percent}% ({stats.doneStages}/{stats.totalStages})
                    </span>
                  </div>
                  <div className="progress-bar-container mt-1.5 h-1.5">
                    <div
                      className="progress-fill bg-[#58a6ff]"
                      style={{ width: `${stats.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
