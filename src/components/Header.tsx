import React, { useState, useEffect } from 'react';
import { UserProfile, TabType } from '../types';
import { Sun, Moon, ChevronDown, Plus, Check, Clock, CloudSun } from 'lucide-react';

interface HeaderProps {
  activeProfile: UserProfile | null;
  profiles: UserProfile[];
  onSelectProfile: (id: string) => void;
  onAddNewProfile: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onTabChange: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  profiles,
  onSelectProfile,
  onAddNewProfile,
  isDark,
  onToggleTheme,
  onTabChange
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

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

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Time & Weather Pill */}
          <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-[#161b22] px-3 py-1 text-xs font-semibold text-[#8b949e] md:flex">
            <span className="flex items-center gap-1 text-[#f0f6fc]">
              <Clock className="h-3.5 w-3.5 text-[#58a6ff]" />
              {currentTime}
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="flex items-center gap-1 text-[#8b949e]">
              <CloudSun className="h-3.5 w-3.5 text-[#d29922]" />
              26°C
            </span>
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
              <span className="max-w-[100px] truncate sm:max-w-[140px]">
                {activeProfile ? `${activeProfile.name} - ${activeProfile.classLevel}` : 'Select Profile'}
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
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161b22] px-2.5 py-1.5 text-xs font-semibold text-[#8b949e] transition-all hover:border-[#58a6ff]/40 hover:text-[#58a6ff] sm:px-3 sm:text-xs"
            title="Toggle theme"
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-[#d29922]" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-[#58a6ff]" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
