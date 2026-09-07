import React from 'react';
import { UserProfile, SubjectName, SubjectData } from '../types';
import { getDaysRemaining, formatDateIndian } from '../utils/helpers';
import { getRankedChapters } from '../utils/prioritizer';
import {
  AlertOctagon,
  Flame,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
  BookOpen
} from 'lucide-react';

interface PanicModeBannerProps {
  profile: UserProfile;
  onNavigateToChapters: (subject: SubjectName) => void;
  onTogglePanicManual: () => void;
}

export const PanicModeBanner: React.FC<PanicModeBannerProps> = ({
  profile,
  onNavigateToChapters,
  onTogglePanicManual
}) => {
  // Find the subject with the fewest days remaining
  let nearestSubject: SubjectName = 'Mathematics';
  let minDays = 999;
  let nearestDate = '';

  for (const [sub, rawData] of Object.entries(profile.subjects)) {
    const data = rawData as SubjectData;
    const days = getDaysRemaining(data.examDate);
    if (days >= 0 && days < minDays) {
      minDays = days;
      nearestSubject = sub as SubjectName;
      nearestDate = data.examDate;
    }
  }

  // Automatic trigger: <= 7 days, or manual toggle in profile
  const isAutoActive = minDays >= 0 && minDays <= 7;
  const isManualActive = profile.panicModeManual === true;
  const isActive = isManualActive || (isAutoActive && profile.panicModeManual !== false);

  if (!isActive) return null;

  // Determine intensity
  let level = 1; // 7 days
  let levelLabel = 'Sprint Alert (7 Days Left)';
  let bannerBg = 'border-amber-500/50 bg-gradient-to-r from-amber-950/80 via-[#161b22] to-amber-950/40 text-amber-200';
  let badgeColor = 'bg-amber-500 text-slate-950';

  if (minDays <= 1) {
    level = 3;
    levelLabel = 'EMERGENCY: Final 24h Countdown! 🚨';
    bannerBg = 'border-red-500/70 bg-gradient-to-r from-red-950/90 via-[#161b22] to-rose-950/80 text-rose-200';
    badgeColor = 'bg-rose-500 text-white animate-pulse';
  } else if (minDays <= 3) {
    level = 2;
    levelLabel = 'High Urgency: 3-Day Countdown Drill 🔥';
    bannerBg = 'border-orange-500/60 bg-gradient-to-r from-orange-950/80 via-[#161b22] to-red-950/50 text-orange-200';
    badgeColor = 'bg-orange-500 text-slate-950';
  }

  // Extract top 3 "Must Finish Today" chapters for the nearest exam subject
  const ranked = getRankedChapters(profile).filter(r => r.subject === nearestSubject);
  const mustFinishChapters = ranked.slice(0, 3);

  return (
    <div className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 shadow-2xl transition-all ${bannerBg}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left info */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider ${badgeColor}`}>
              <ShieldAlert className="h-3.5 w-3.5" />
              Pre-Exam Panic Mode Active
            </span>
            <span className="text-xs font-bold text-[#f0f6fc]">
              {levelLabel}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Focus Mode: {nearestSubject} Exam is in{' '}
            <span className="text-amber-400 underline decoration-amber-500 decoration-2">
              {minDays === 0 ? 'TODAY!' : `${minDays} Days (${formatDateIndian(nearestDate)})`}
            </span>
          </h3>

          <p className="text-xs text-white/80 max-w-xl">
            {level === 3
              ? 'Zero new heavy topics! Focus strictly on formula sheets, NCERT summary notes, and your Mistake Journal.'
              : level === 2
              ? 'Tackle the top 3 unrevised/weak chapters below. Do 35-minute timed mock questions.'
              : 'High-yield revision sprint activated. Non-critical subjects de-emphasized until exam completes.'}
          </p>
        </div>

        {/* Right action & Manual Toggle */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => onNavigateToChapters(nearestSubject)}
            className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-slate-200 shadow-lg"
          >
            Open {nearestSubject} Chapters
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onTogglePanicManual}
            className="rounded-xl border border-white/20 bg-black/40 px-3 py-2.5 text-xs font-bold text-white/80 hover:bg-black/60"
            title="Deactivate Panic Mode"
          >
            Exit Panic Mode
          </button>
        </div>
      </div>

      {/* Must Finish Today Checklist */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
            ⚡ Must Finish Today — Critical High-Priority Chapters
          </span>
          <span className="text-[11px] font-semibold text-white/70">
            Ranked by exam weightage, difficulty & unresolved mistakes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {mustFinishChapters.map((item, idx) => (
            <div
              key={item.chapter.id}
              onClick={() => onNavigateToChapters(item.subject)}
              className="cursor-pointer flex items-center justify-between rounded-xl border border-white/15 bg-black/30 p-2.5 hover:bg-black/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {idx + 1}. {item.chapter.name}
                </div>
                <div className="text-[10px] text-amber-300 font-semibold truncate">
                  {item.difficulty} • {item.mistakesCount > 0 ? `${item.mistakesCount} Mistakes` : `${item.percentDone}% Done`}
                </div>
              </div>
              <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-black text-amber-300 ml-2 shrink-0">
                Score {item.priorityScore}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
