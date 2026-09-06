import React from 'react';
import { UserProfile, SubjectName } from '../types';
import { SUBJECTS, SUBJECT_COLORS } from '../data/cbseData';
import { getDaysRemaining, formatDateIndian } from '../utils/helpers';
import { Calendar, Flame, Clock, Sparkles, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ExamDayTrackerProps {
  profile: UserProfile;
  onOpenSettings: () => void;
  onSelectSubject: (subject: SubjectName) => void;
}

export const ExamDayTracker: React.FC<ExamDayTrackerProps> = ({
  profile,
  onOpenSettings,
  onSelectSubject
}) => {
  // Sort subjects by nearest exam date
  const sortedSubjects = [...SUBJECTS]
    .map(sub => {
      const examDate = profile.subjects[sub]?.examDate || '';
      const daysLeft = getDaysRemaining(examDate);
      return {
        subject: sub,
        examDate,
        daysLeft
      };
    })
    .sort((a, b) => {
      // Put upcoming first, then passed
      if (a.daysLeft >= 0 && b.daysLeft >= 0) return a.daysLeft - b.daysLeft;
      if (a.daysLeft < 0 && b.daysLeft >= 0) return 1;
      if (a.daysLeft >= 0 && b.daysLeft < 0) return -1;
      return b.daysLeft - a.daysLeft;
    });

  const nearestExam = sortedSubjects.find(s => s.daysLeft >= 0) || sortedSubjects[0];

  // Overall sprint calculation (assume 60-day sprint or from profile creation)
  const totalSprintDays = 60;
  const daysElapsed = Math.min(totalSprintDays, Math.max(1, totalSprintDays - (nearestExam?.daysLeft || 0)));
  const sprintProgressPercent = Math.min(100, Math.max(5, Math.round((daysElapsed / totalSprintDays) * 100)));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#161b22] p-4 sm:p-5 transition-all">
      {/* Top Bento Header Row */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="card-title m-0 mb-2">
            <span>📅</span>
            <span>{profile.classLevel} Board Exam Day Tracker</span>
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-[#f0f6fc] sm:text-2xl">
            {nearestExam && nearestExam.daysLeft >= 0 ? (
              <>
                <span className="text-[#58a6ff]">{nearestExam.daysLeft} Days</span> until {nearestExam.subject} Exam
              </>
            ) : (
              'All CBSE Exams Completed!'
            )}
          </h2>
          <p className="mt-1 text-xs text-[#8b949e] sm:text-sm">
            Target: <span className="font-semibold text-[#f0f6fc]">{formatDateIndian(nearestExam?.examDate || '')}</span> • Daily pace required for full syllabus coverage.
          </p>
        </div>

        {/* Big Countdown Badge in Bento Style */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-[#58a6ff] sm:text-3xl">
                {Math.max(0, nearestExam?.daysLeft || 0)}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8b949e]">Days Left</span>
            </div>
            <div className="h-7 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#f0f6fc]">
                Next: {nearestExam?.subject}
              </span>
              <span className="text-[11px] text-[#8b949e]">
                {formatDateIndian(nearestExam?.examDate || '')}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#8b949e] transition-all hover:border-[#58a6ff]/40 hover:text-[#58a6ff]"
            title="Edit Datesheet"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bento Progress Bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-semibold text-[#8b949e]">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#58a6ff]" />
            Exam Sprint Progress (Day {daysElapsed} / {totalSprintDays})
          </span>
          <span className="text-[#58a6ff] font-bold">{sprintProgressPercent}% through countdown</span>
        </div>
        <div className="progress-bar-container mt-2">
          <div
            className="progress-fill bg-[#58a6ff]"
            style={{ width: `${sprintProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Upcoming Exam Cards Bento Tile Row */}
      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b949e]">
            CBSE Subject Datesheet Schedule
          </span>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 text-xs font-semibold text-[#58a6ff] hover:underline"
          >
            Modify Dates <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {sortedSubjects.map(item => {
            const colors = SUBJECT_COLORS[item.subject];
            const isPassed = item.daysLeft < 0;
            const isCritical = item.daysLeft >= 0 && item.daysLeft <= 15;

            return (
              <div
                key={item.subject}
                onClick={() => onSelectSubject(item.subject)}
                className={`flex min-w-[165px] cursor-pointer flex-col justify-between rounded-xl border p-3 transition-all hover:-translate-y-0.5 ${
                  item.subject === nearestExam?.subject
                    ? 'border-[#58a6ff]/60 bg-[#58a6ff]/5'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${colors.text}`}>
                    {item.subject}
                  </span>
                  {isPassed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#238636]" />
                  ) : isCritical ? (
                    <span className="flex h-2 w-2 rounded-full bg-[#d29922]" />
                  ) : (
                    <span className="flex h-2 w-2 rounded-full bg-[#58a6ff]" />
                  )}
                </div>

                <div className="mt-2 text-xs text-[#8b949e]">
                  {formatDateIndian(item.examDate)}
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isPassed
                        ? 'bg-white/[0.05] text-[#8b949e]'
                        : isCritical
                        ? 'bg-[#d29922]/15 text-[#d29922]'
                        : 'bg-[#58a6ff]/15 text-[#58a6ff]'
                    }`}
                  >
                    {isPassed ? 'Completed' : `${item.daysLeft} Days Left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
