import React, { useState } from 'react';
import { UserProfile, SubjectName } from '../types';
import { calculateSyllabusPrediction, SubjectPrediction } from '../utils/syllabusPredictor';
import { SUBJECTS, SUBJECT_COLORS } from '../data/cbseData';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Zap,
  Target
} from 'lucide-react';

interface SyllabusPredictorCardProps {
  profile: UserProfile;
  onNavigateToSubject: (subject: SubjectName) => void;
}

export const SyllabusPredictorCard: React.FC<SyllabusPredictorCardProps> = ({
  profile,
  onNavigateToSubject
}) => {
  const prediction = calculateSyllabusPrediction(profile);
  const [expanded, setExpanded] = useState(false);

  // Status configuration
  let statusBadge = {
    label: '🟢 On Track for Board Exams',
    bg: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    summaryText: 'At your current pace, you are on schedule to finish before the exam date!'
  };

  if (prediction.status === 'tight') {
    statusBadge = {
      label: '🟡 Tight Pace Margin',
      bg: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      summaryText: 'Buffer before exam is slim. Adding ~30 mins daily will guarantee full mock revision time.'
    };
  } else if (prediction.status === 'behind') {
    statusBadge = {
      label: '🔴 Pace Action Required',
      bg: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
      summaryText: 'Pace needs acceleration to complete all NCERT chapters before board exams begin.'
    };
  }

  return (
    <div className="bento-card overflow-hidden">
      {/* Top Banner Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 text-slate-950 font-black">
            <Target className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8b949e]">
              Syllabus Completion Predictor
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#f0f6fc]">
              Projected Full Completion:{' '}
              <span className="text-[#58a6ff]">{prediction.predictedCompletionDateStr}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadge.bg}`}>
            {statusBadge.label}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-2.5 py-1 text-xs font-semibold text-[#8b949e] hover:text-white"
          >
            {expanded ? 'Hide Subjects' : 'All Subjects'}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-[#8b949e] leading-relaxed">
        {statusBadge.summaryText} Based on{' '}
        <span className="font-bold text-[#f0f6fc]">{prediction.remainingStages} remaining stages</span> across{' '}
        <span className="font-bold text-[#f0f6fc]">{prediction.totalChapters} chapters</span> and recent study logs.
      </p>

      {/* Progress Bar of Whole Syllabus */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#8b949e] mb-1">
          <span>Overall CBSE Syllabus Covered</span>
          <span className="font-bold text-[#58a6ff]">{prediction.overallPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.max(4, prediction.overallPercent)}%` }}
          />
        </div>
      </div>

      {/* Expanded Subject Breakdown */}
      {expanded && (
        <div className="mt-4 border-t border-white/10 pt-4 space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
            Subject-wise Projected Completion & Buffer
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SUBJECTS.map(sub => {
              const p: SubjectPrediction = prediction.subjectPredictions[sub];
              const color = SUBJECT_COLORS[sub] || {
                accent: '#38bdf8',
                bg: 'bg-sky-500/10',
                text: 'text-sky-400'
              };

              let subStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
              let statusLabel = 'On Track';
              if (p.status === 'tight') {
                subStatusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                statusLabel = 'Tight Margin';
              } else if (p.status === 'behind') {
                subStatusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
                statusLabel = 'Behind Schedule';
              }

              return (
                <div
                  key={sub}
                  onClick={() => onNavigateToSubject(sub)}
                  className="cursor-pointer rounded-xl border border-white/10 bg-[#161b22] p-3 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#f0f6fc] group-hover:text-[#58a6ff]">
                      {sub}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${subStatusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-[#8b949e]">
                    Completion: <span className="font-bold text-[#f0f6fc]">{p.predictedCompletionDateStr}</span>
                  </div>

                  <div className="text-[10px] text-[#8b949e]">
                    Exam Date: {p.examDate ? p.examDate : 'Not set'} ({p.daysLeft}d left)
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-[#8b949e]">
                      {p.completedStages}/{p.totalStages} stages ({p.percent}%)
                    </span>
                    <span className="font-semibold text-sky-400">View Chapters →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
