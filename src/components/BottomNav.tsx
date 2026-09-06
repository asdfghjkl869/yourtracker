import React from 'react';
import { TabType } from '../types';
import { Home, BookOpen, Timer, Moon, BarChart3, Settings, BookMarked } from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'chapters' as TabType, label: 'Chapters', icon: BookOpen },
    { id: 'sessions' as TabType, label: 'Study & Habits', icon: Timer },
    { id: 'sleep' as TabType, label: 'Sleep', icon: Moon },
    { id: 'insights' as TabType, label: 'Trends', icon: BarChart3 },
    { id: 'resources' as TabType, label: 'Notes', icon: BookMarked },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <nav aria-label="Bottom Navigation" className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#010409]/95 backdrop-blur-md">
      <div className="mx-auto flex h-15 max-w-4xl items-center justify-around px-1 sm:px-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-item-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`group flex flex-1 flex-col items-center justify-center py-1.5 transition-all ${
                isActive ? 'text-[#58a6ff] opacity-100' : 'text-[#8b949e] opacity-60 hover:opacity-100 hover:text-[#f0f6fc]'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <Icon
                  className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'stroke-[2.2px] text-[#58a6ff]' : 'stroke-[1.8px]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-[#58a6ff]" />
                )}
              </div>
              <span
                className={`mt-1 text-[10px] tracking-tight sm:text-[11px] ${
                  isActive ? 'font-bold text-[#58a6ff]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
