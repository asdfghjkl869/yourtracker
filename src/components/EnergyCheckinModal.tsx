import React from 'react';
import { EnergyLevel } from '../types';
import { Battery, BatteryCharging, Flame, X, Sparkles, Check } from 'lucide-react';

interface EnergyCheckinModalProps {
  isOpen: boolean;
  currentEnergy?: EnergyLevel;
  onSelectEnergy: (energy: EnergyLevel) => void;
  onClose: () => void;
}

export const EnergyCheckinModal: React.FC<EnergyCheckinModalProps> = ({
  isOpen,
  currentEnergy = 'Medium',
  onSelectEnergy,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1117] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-[#f0f6fc]">
              Daily Energy Check-in
            </h3>
          </div>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-[#8b949e]">
          How is your mental bandwidth and focus today? The Auto Daily Plan Generator automatically tunes study sprint durations and chapter difficulty to match your state.
        </p>

        <div className="space-y-2.5">
          {/* Low Energy */}
          <button
            type="button"
            onClick={() => {
              onSelectEnergy('Low');
              onClose();
            }}
            className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
              currentEnergy === 'Low'
                ? 'border-emerald-500/60 bg-emerald-500/15 text-white'
                : 'border-white/10 bg-[#161b22] hover:border-white/20'
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-black">
              <Battery className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-300">
                  Low (Light & Recovery)
                </span>
                {currentEnergy === 'Low' && <Check className="h-4 w-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-[#8b949e] mt-0.5">
                Feeling tired or heavy school workload. Schedules 3 shorter (25m) review sessions, formulas, and light revision.
              </p>
            </div>
          </button>

          {/* Medium Energy */}
          <button
            type="button"
            onClick={() => {
              onSelectEnergy('Medium');
              onClose();
            }}
            className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
              currentEnergy === 'Medium'
                ? 'border-sky-500/60 bg-sky-500/15 text-white'
                : 'border-white/10 bg-[#161b22] hover:border-white/20'
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 font-black">
              <BatteryCharging className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-300">
                  Medium (Steady State)
                </span>
                {currentEnergy === 'Medium' && <Check className="h-4 w-4 text-sky-400" />}
              </div>
              <p className="text-[11px] text-[#8b949e] mt-0.5">
                Normal balanced focus. Schedules 4-5 core tasks (35-45m each) covering standard NCERT exercises.
              </p>
            </div>
          </button>

          {/* High Energy */}
          <button
            type="button"
            onClick={() => {
              onSelectEnergy('High');
              onClose();
            }}
            className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
              currentEnergy === 'High'
                ? 'border-amber-500/60 bg-amber-500/15 text-white'
                : 'border-white/10 bg-[#161b22] hover:border-white/20'
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-black">
              <Flame className="h-5 w-5 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300">
                  High (Deep Work Beast Mode)
                </span>
                {currentEnergy === 'High' && <Check className="h-4 w-4 text-amber-400" />}
              </div>
              <p className="text-[11px] text-[#8b949e] mt-0.5">
                High clarity and energy! Schedules 5-7 intense tasks (50-60m) tackling Hard chapters, HOTS, and numerical problems.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
