import React from 'react';
import { SubjectName, UserProfile } from '../types';
import { SUBJECT_COLORS } from '../data/cbseData';
import { calculateSubjectStats } from '../utils/helpers';
import { ChevronRight, Play, BookOpen, Clock, Target } from 'lucide-react';

interface SubjectCardProps {
  subject: SubjectName;
  profile: UserProfile;
  onSelectSubject: (subject: SubjectName) => void;
  onStartStudySession: (subject: SubjectName) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  profile,
  onSelectSubject,
  onStartStudySession
}) => {
  const stats = calculateSubjectStats(profile, subject);
  const colors = SUBJECT_COLORS[subject];

  const badgeClass =
    stats.status === 'On Track'
      ? 'border-[#238636]/40 bg-[#238636]/15 text-[#3fb950]'
      : stats.status === 'Action Required'
      ? 'border-[#d29922]/40 bg-[#d29922]/15 text-[#d29922]'
      : 'border-white/10 bg-white/[0.05] text-[#8b949e]';

  const barColor =
    stats.status === 'Action Required'
      ? 'bg-[#d29922]'
      : stats.status === 'Passed'
      ? 'bg-[#8b949e]'
      : 'bg-[#58a6ff]';

  // Study hours progress this week
  const studyHoursPercent = Math.min(100, Math.round((stats.weeklyHoursStudied / stats.weeklyTargetHours) * 100));

  return (
    <div
      id={`subject-card-${subject.toLowerCase().replace(/\s+/g, '-')}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#161b22] p-5 transition-all duration-200 hover:border-[#58a6ff]/40 hover:bg-[#1c2129]"
    >
      <div>
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${colors.bg} ${colors.border} border`} />
            <h3
              onClick={() => onSelectSubject(subject)}
              className="cursor-pointer text-base font-bold text-[#f0f6fc] transition-colors group-hover:text-[#58a6ff]"
            >
              {subject}
            </h3>
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
            {stats.status}
          </span>
        </div>

        {/* Completion percentage row */}
        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tight text-[#f0f6fc]">
              {stats.percent}%
            </span>
            <span className="text-xs font-semibold text-[#8b949e]">Syllabus</span>
          </div>
          <span className="text-xs font-medium text-[#8b949e]">
            {stats.doneStages} / {stats.totalStages} Stages
          </span>
        </div>

        {/* Visual Progress Bar 1: Syllabus Stages */}
        <div className="progress-bar-container mt-2">
          <div
            className={`progress-fill ${barColor}`}
            style={{ width: `${stats.percent}%` }}
          />
        </div>

        {/* Visual Progress Bar 2: Weekly Study Hours Tracker */}
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
          <div className="flex items-center justify-between text-[11px] text-[#8b949e]">
            <span className="flex items-center gap-1 font-semibold text-[#f0f6fc]">
              <Clock className="h-3 w-3 text-[#58a6ff]" />
              Weekly Study Log
            </span>
            <span className="font-bold text-[#58a6ff]">
              {stats.weeklyHoursStudied}h / {stats.weeklyTargetHours}h
            </span>
          </div>
          <div className="progress-bar-container mt-1.5 h-1.5">
            <div
              className="progress-fill bg-[#58a6ff]"
              style={{ width: `${studyHoursPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meta pace and days left */}
      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between text-xs text-[#8b949e]">
          <span>{stats.daysLeft >= 0 ? `${stats.daysLeft} Days Left` : 'Exam Passed'}</span>
          <span className="font-semibold text-[#f0f6fc]">
            Pace: {stats.pace} stg/day
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onSelectSubject(subject)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs font-bold text-[#f0f6fc] transition-colors hover:border-[#58a6ff]/40 hover:text-[#58a6ff]"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Chapters ({stats.chaptersCount})
          </button>
          <button
            onClick={() => onStartStudySession(subject)}
            className="flex items-center justify-center rounded-xl bg-[#58a6ff]/15 px-3.5 py-2 text-xs font-bold text-[#58a6ff] transition-colors hover:bg-[#58a6ff] hover:text-[#0b0f19]"
            title="Start Study Session"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span className="ml-1 hidden sm:inline">Study</span>
          </button>
        </div>
      </div>
    </div>
  );
};
