import React, { useState, useEffect } from 'react';
import { UserProfile, TabType, ExamMode, EnergyLevel } from '../types';
import {
  Sun,
  Moon,
  ChevronDown,
  Plus,
  Check,
  Clock,
  CloudSun,
  Flame,
  Battery,
  BatteryCharging,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeProfile: UserProfile | null;
  profiles: UserProfile[];
  onSelectProfile: (id: string) => void;
  onAddNewProfile: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onTabChange: (tab: TabType) => void;
  onOpenEnergyModal?: () => void;
  onExamModeChange?: (mode: ExamMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  profiles,
  onSelectProfile,
  onAddNewProfile,
  isDark,
  onToggleTheme,
  onTabChange,
  onOpenEnergyModal,
  onExamModeChange
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [examModeDropdownOpen, setExamModeDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentEnergy: EnergyLevel =
    (activeProfile?.energyLevels && activeProfile.energyLevels[todayStr]) || 'Medium';
  const currentExamMode: ExamMode = activeProfile?.examMode || 'Final Boards';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0b0f19]/90 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand */}
        <div
          id="header-brand-logo"
          onClick={() => onTabChange('home')}
          className="group flex cursor-pointer items-center gap-2.5 transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#58a6ff] font-extrabold text-[#0b0f19] shadow-md shadow-[#58a6ff]/25 transition-all group-hover:bg-sky-300">
            S
          </div>
          <div className="flex flex-col">
            <h1 className="m-0 text-base font-extrabold tracking-tight text-[#f0f6fc] sm:text-lg">
              UMANG <span className="text-[#58a6ff]">Bhaiya</span>
            </h1>
            <p className="m-0 hidden text-[10px] font-semibold text-[#8b949e] sm:inline">
              CBSE Study Tracker
            </p>
          </div>
        </div>

        {/* Center / Right actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Daily Energy Level Badge */}
          <button
            onClick={onOpenEnergyModal}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-all ${
              currentEnergy === 'High'
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                : currentEnergy === 'Low'
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : 'border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
            }`}
            title="Click to update Daily Energy Level"
          >
            {currentEnergy === 'High' && <Flame className="h-3.5 w-3.5 fill-current text-amber-400" />}
            {currentEnergy === 'Low' && <Battery className="h-3.5 w-3.5 text-emerald-400" />}
            {currentEnergy === 'Medium' && <BatteryCharging className="h-3.5 w-3.5 text-sky-400" />}
            <span className="hidden sm:inline">{currentEnergy} Energy</span>
          </button>

          {/* Exam Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExamModeDropdownOpen(!examModeDropdownOpen)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#161b22] px-2.5 py-1 text-xs font-bold text-[#f0f6fc] hover:border-white/20 sm:px-3"
              title="Change Exam Mode"
            >
              <span className="h-2 w-2 rounded-full bg-[#58a6ff]" />
              <span className="hidden sm:inline">{currentExamMode}</span>
              <span className="sm:hidden">{currentExamMode.split(' ')[0]}</span>
              <ChevronDown className="h-3 w-3 text-[#8b949e]" />
            </button>

            {examModeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setExamModeDropdownOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-white/10 bg-[#161b22] p-1.5 shadow-2xl ring-1 ring-white/10">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">
                    Exam Mode
                  </div>
                  {(['Mid-terms', 'Pre-boards', 'Final Boards'] as ExamMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => {
                        onExamModeChange?.(mode);
                        setExamModeDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-bold transition-all ${
                        currentExamMode === mode
                          ? 'bg-[#58a6ff]/15 text-[#58a6ff]'
                          : 'text-[#8b949e] hover:bg-white/[0.04] hover:text-[#f0f6fc]'
                      }`}
                    >
                      <span>{mode}</span>
                      {currentExamMode === mode && <Check className="h-3.5 w-3.5 text-[#58a6ff]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              id="profile-dropdown-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-[#161b22] px-2.5 py-1 text-xs font-semibold text-[#f0f6fc] transition-all hover:border-[#58a6ff]/50 hover:bg-[#1c2129] sm:px-3 sm:py-1.5 sm:text-sm"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#58a6ff] to-blue-600 text-[11px] font-bold text-white shadow-inner">
                {activeProfile ? getInitials(activeProfile.name) : 'A'}
              </div>
              <span className="max-w-[80px] truncate sm:max-w-[120px]">
                {activeProfile ? activeProfile.name : 'Profile'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#8b949e]" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-[#161b22] p-2 shadow-2xl shadow-black/80 ring-1 ring-white/10">
                  <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-[#8b949e] uppercase">
                    Student Profiles
                  </div>
                  <div className="max-h-56 space-y-1 overflow-y-auto">
                    {profiles.map(p => {
                      const isActive = activeProfile?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            onSelectProfile(p.id);
                            setDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-[#58a6ff]/15 text-[#58a6ff]'
                              : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-bold">
                              {getInitials(p.name)}
                            </span>
                            <span>{p.name}</span>
                            <span className="text-[10px] text-[#8b949e]">({p.classLevel})</span>
                          </div>
                          {isActive && <Check className="h-3.5 w-3.5 text-[#58a6ff]" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={() => {
                      onAddNewProfile();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-[#58a6ff] transition-colors hover:bg-[#58a6ff]/10"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New Profile</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161b22] px-2.5 py-1.5 text-xs font-semibold text-[#8b949e] transition-all hover:border-[#58a6ff]/40 hover:text-[#58a6ff]"
            title="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5 text-[#d29922]" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-[#58a6ff]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
