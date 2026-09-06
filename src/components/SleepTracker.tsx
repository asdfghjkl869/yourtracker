import React, { useState } from 'react';
import { UserProfile, DailySleepLog } from '../types';
import { Moon, Sun, Bed, Sparkles, CheckCircle2, AlertTriangle, Trash2, ShieldCheck, Heart, Calendar, Clock } from 'lucide-react';

interface SleepTrackerProps {
  profile: UserProfile;
  onSaveSleepLog: (log: DailySleepLog) => void;
  onDeleteSleepLog: (dateStr: string) => void;
}

export const SleepTracker: React.FC<SleepTrackerProps> = ({
  profile,
  onSaveSleepLog,
  onDeleteSleepLog
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [hours, setHours] = useState<number>(7.5);
  const [bedTime, setBedTime] = useState<string>('23:00');
  const [wakeTime, setWakeTime] = useState<string>('06:30');
  const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const [notes, setNotes] = useState<string>('');

  // Check if today already has a log
  const todayLog = profile.sleepLogs ? profile.sleepLogs[todayStr] : undefined;

  const handleSave = () => {
    onSaveSleepLog({
      date: selectedDate,
      hours: Number(hours),
      bedTime: bedTime || undefined,
      wakeTime: wakeTime || undefined,
      quality,
      notes: notes.trim() || undefined
    });
    setNotes('');
  };

  // Calculate past 7 days average sleep
  const sleepLogsArray: DailySleepLog[] = Object.values(profile.sleepLogs || {});
  const sortedLogs: DailySleepLog[] = [...sleepLogsArray].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recent7Logs = sortedLogs.slice(0, 7);
  const avgSleepHours = recent7Logs.length > 0
    ? Number((recent7Logs.reduce((acc, l) => acc + l.hours, 0) / recent7Logs.length).toFixed(1))
    : 0;

  let restStatus = 'Optimal Recovery';
  let restStatusColor = 'text-[#3fb950] bg-[#238636]/15 border-[#238636]/30';
  if (avgSleepHours < 6.5 && avgSleepHours > 0) {
    restStatus = 'Sleep Deficit';
    restStatusColor = 'text-[#f85149] bg-[#f85149]/15 border-[#f85149]/30';
  } else if (avgSleepHours >= 6.5 && avgSleepHours < 7.0) {
    restStatus = 'Moderate Rest';
    restStatusColor = 'text-[#d29922] bg-[#d29922]/15 border-[#d29922]/30';
  }

  const getQualityBadge = (q: string) => {
    switch (q) {
      case 'excellent':
        return { label: '🌟 Excellent', class: 'bg-[#238636]/15 text-[#3fb950] border-[#238636]/30' };
      case 'good':
        return { label: '😊 Good', class: 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30' };
      case 'fair':
        return { label: '😐 Fair', class: 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/30' };
      case 'poor':
      default:
        return { label: '🥱 Tired', class: 'bg-[#f85149]/15 text-[#f85149] border-[#f85149]/30' };
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="card-title m-0 mb-1">
            <span>🌙</span>
            <span>Sleep & Recovery Tracker</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#f0f6fc] sm:text-3xl">
            Sleep Monitor & Rest Science
          </h2>
          <p className="text-xs text-[#8b949e] sm:text-sm">
            Monitor nightly rest hours to boost cognitive retention and exam focus.
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold ${restStatusColor}`}>
          <Heart className="h-3.5 w-3.5" />
          7-Day Avg: {avgSleepHours} hrs/night ({restStatus})
        </div>
      </div>

      {/* Grid: Log Entry + Rest Insights */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Sleep Logging Form */}
        <div className="bento-card lg:col-span-7 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="card-title m-0">
              <span>🌙</span>
              <span>Log Daily Sleep</span>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b0f19] px-2.5 py-1 text-xs font-semibold text-[#f0f6fc]"
            />
          </div>

          <div className="mt-5 space-y-4">
            {/* Hours Selector */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#f0f6fc]">Total Rest Hours</label>
                <span className="text-2xl font-black text-[#58a6ff]">{hours} hrs</span>
              </div>

              <input
                type="range"
                min="4"
                max="11"
                step="0.5"
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
                className="mt-2 w-full accent-[#58a6ff]"
              />

              {/* Quick Preset Buttons */}
              <div className="mt-2 flex gap-2">
                {[6, 7, 7.5, 8, 8.5, 9].map(h => (
                  <button
                    key={h}
                    onClick={() => setHours(h)}
                    className={`flex-1 rounded-xl border py-1 text-xs font-bold transition-all ${
                      hours === h
                        ? 'border-[#58a6ff] bg-[#58a6ff]/20 text-[#58a6ff]'
                        : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Bed & Wake Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-[#8b949e]">
                  <Bed className="h-3 w-3 text-[#58a6ff]" />
                  Bedtime
                </label>
                <input
                  type="time"
                  value={bedTime}
                  onChange={e => setBedTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-3 py-2 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-[#8b949e]">
                  <Sun className="h-3 w-3 text-[#d29922]" />
                  Wake Time
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={e => setWakeTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-3 py-2 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                />
              </div>
            </div>

            {/* Sleep Quality */}
            <div>
              <label className="text-xs font-bold text-[#8b949e]">Sleep Quality & Energy</label>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: 'excellent', label: '🌟 Deep & Rested' },
                  { id: 'good', label: '😊 Good Sleep' },
                  { id: 'fair', label: '😐 Average' },
                  { id: 'poor', label: '🥱 Tired' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setQuality(item.id as any)}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                      quality === item.id
                        ? 'border-[#58a6ff] bg-[#58a6ff]/20 text-[#58a6ff]'
                        : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-[#8b949e]">Sleep Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Woke up energized, solved sample paper in the morning"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-3 py-2 text-xs text-[#f0f6fc] outline-none placeholder:text-[#8b949e]/50 focus:border-[#58a6ff]"
              />
            </div>

            <button
              onClick={handleSave}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#58a6ff] py-3 text-xs font-bold text-[#0b0f19] transition-colors hover:bg-sky-400"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save Sleep Record for {selectedDate}
            </button>
          </div>
        </div>

        {/* Cognitive Recovery Advice & Guidelines */}
        <div className="bento-card lg:col-span-5 flex flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="card-title m-0">
              <span>🧠</span>
              <span>CBSE Study & Rest Science</span>
            </div>

            <div className="mt-4 space-y-3 text-xs text-[#8b949e]">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="font-bold text-[#f0f6fc]">Long-Term Memory Consolidation</p>
                <p className="mt-1 text-[#8b949e]">
                  During deep slow-wave sleep, the brain replays mathematics formulas and science reactions, transitioning them into permanent memory.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="font-bold text-[#3fb950]">Target: 7 - 8 Hours per Night</p>
                <p className="mt-1 text-[#8b949e]">
                  Sleeping under 6 hours before an exam reduces numerical calculation speed by up to 28% and creates avoidable calculation slips.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="font-bold text-[#d29922]">Evening Wind-Down Rule</p>
                <p className="mt-1 text-[#8b949e]">
                  Put screens away 30 minutes before sleep. Review physical formula cheat-sheets or language summaries to fall asleep naturally.
                </p>
              </div>
            </div>
          </div>

          {todayLog && (
            <div className="mt-5 rounded-xl border border-[#58a6ff]/30 bg-[#58a6ff]/10 p-3 text-xs text-[#58a6ff]">
              <span className="font-bold">Logged today:</span> {todayLog.hours} hours ({todayLog.quality} quality).
            </div>
          )}
        </div>
      </div>

      {/* Daily Sleep History Table */}
      <div className="bento-card p-5 sm:p-6">
        <div className="card-title m-0">
          <span>📋</span>
          <span>Daily Sleep History Log</span>
        </div>
        <p className="mt-1 text-xs text-[#8b949e]">Keep track of your rest consistency across exam season.</p>

        <div className="mt-4 space-y-2">
          {sortedLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-[#8b949e]">
              No sleep records logged yet. Enter your sleep above!
            </div>
          ) : (
            sortedLogs.map(log => {
              const badge = getQualityBadge(log.quality);
              return (
                <div
                  key={log.date}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#58a6ff]/15 font-black text-xs text-[#58a6ff] border border-[#58a6ff]/30">
                      {log.hours}h
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#f0f6fc]">{log.date}</span>
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${badge.class}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#8b949e]">
                        {log.bedTime && <span>Bed: {log.bedTime}</span>}
                        {log.wakeTime && <span>• Wake: {log.wakeTime}</span>}
                        {log.notes && <span className="line-clamp-1 italic">• "{log.notes}"</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteSleepLog(log.date)}
                    className="rounded-lg p-2 text-[#8b949e] hover:text-[#f85149]"
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
