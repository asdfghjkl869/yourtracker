import React, { useState } from 'react';
import { UserProfile, SubjectName, ChapterDifficulty } from '../types';
import { SUBJECTS, DEFAULT_STAGES, SYLLABUS_DATA } from '../data/cbseData';
import { calculateChapterPriorityScore, getChapterMistakesCount } from '../utils/prioritizer';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Plus,
  Scissors,
  RotateCcw,
  Edit2,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpDown,
  Tag
} from 'lucide-react';

interface ChaptersViewProps {
  profile: UserProfile;
  initialSubject?: SubjectName;
  onCycleStage: (subject: SubjectName, chapterId: string, stageIdx: number) => void;
  onMarkAllDone: (subject: SubjectName, chapterId: string) => void;
  onResetStages: (subject: SubjectName, chapterId: string) => void;
  onCutChapter: (subject: SubjectName, chapterId: string) => void;
  onRenameChapter: (subject: SubjectName, chapterId: string, newName: string) => void;
  onAddChapter: (subject: SubjectName, chapterName: string) => void;
  onRestoreCBSE: (subject: SubjectName) => void;
  onToggleDifficulty?: (subject: SubjectName, chapterId: string, diff: ChapterDifficulty) => void;
  onNavigateToMistakes?: (subject: SubjectName, chapterName: string) => void;
}

export const ChaptersView: React.FC<ChaptersViewProps> = ({
  profile,
  initialSubject = 'Mathematics',
  onCycleStage,
  onMarkAllDone,
  onResetStages,
  onCutChapter,
  onRenameChapter,
  onAddChapter,
  onRestoreCBSE,
  onToggleDifficulty,
  onNavigateToMistakes
}) => {
  const [activeSubject, setActiveSubject] = useState<SubjectName>(initialSubject);
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'completed' | 'mistakes'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'difficulty' | 'incomplete'>('default');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({});

  // Add chapter dialog state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newChapterName, setNewChapterName] = useState<string>('');

  // Rename modal state
  const [editingChapter, setEditingChapter] = useState<{ id: string; name: string } | null>(null);
  const [renamedTitle, setRenamedTitle] = useState<string>('');

  const stagesList = profile.customStages[activeSubject] || DEFAULT_STAGES[activeSubject] || [];
  const subjectChapters = profile.subjects[activeSubject]?.chapters || [];

  const toggleAccordion = (id: string) => {
    setExpandedChapterIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenRename = (id: string, name: string) => {
    setEditingChapter({ id, name });
    setRenamedTitle(name);
  };

  const handleSaveRename = () => {
    if (editingChapter && renamedTitle.trim()) {
      onRenameChapter(activeSubject, editingChapter.id, renamedTitle.trim());
      setEditingChapter(null);
      setRenamedTitle('');
    }
  };

  const handleCreateChapter = () => {
    if (!newChapterName.trim()) return;
    onAddChapter(activeSubject, newChapterName.trim());
    setNewChapterName('');
    setShowAddModal(false);
  };

  const handleCycleDifficulty = (e: React.MouseEvent, chapterId: string, currentDiff: ChapterDifficulty = 'Medium') => {
    e.stopPropagation();
    const cycleMap: Record<ChapterDifficulty, ChapterDifficulty> = {
      Easy: 'Medium',
      Medium: 'Hard',
      Hard: 'Easy'
    };
    const nextDiff = cycleMap[currentDiff];
    onToggleDifficulty?.(activeSubject, chapterId, nextDiff);
  };

  // Filtered chapters
  let filteredChapters = subjectChapters.filter(ch => {
    // Search query
    if (searchQuery.trim() && !ch.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    const doneCount = ch.stageStates.slice(0, stagesList.length).filter(s => s === 2).length;
    const mistakesCount = getChapterMistakesCount(profile, activeSubject, ch.name);

    if (filter === 'incomplete') {
      return doneCount < stagesList.length;
    }
    if (filter === 'completed') {
      return doneCount === stagesList.length && stagesList.length > 0;
    }
    if (filter === 'mistakes') {
      return mistakesCount > 0;
    }
    return true;
  });

  // Sorting
  if (sortBy === 'priority') {
    filteredChapters = [...filteredChapters].sort((a, b) => {
      const scoreA = calculateChapterPriorityScore(a, activeSubject, profile).score;
      const scoreB = calculateChapterPriorityScore(b, activeSubject, profile).score;
      return scoreB - scoreA;
    });
  } else if (sortBy === 'difficulty') {
    const diffWeight: Record<ChapterDifficulty, number> = { Hard: 3, Medium: 2, Easy: 1 };
    filteredChapters = [...filteredChapters].sort((a, b) => {
      const wA = diffWeight[a.difficulty || 'Medium'];
      const wB = diffWeight[b.difficulty || 'Medium'];
      return wB - wA;
    });
  } else if (sortBy === 'incomplete') {
    filteredChapters = [...filteredChapters].sort((a, b) => {
      const doneA = a.stageStates.slice(0, stagesList.length).filter(s => s === 2).length;
      const doneB = b.stageStates.slice(0, stagesList.length).filter(s => s === 2).length;
      return doneA - doneB;
    });
  }

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="card-title m-0 mb-1">
            <span>📚</span>
            <span>Chapter Mastery & Syllabus</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#f0f6fc] sm:text-3xl">
            {activeSubject} Chapters
          </h2>
          <p className="text-xs text-[#8b949e] sm:text-sm">
            Tag chapter difficulties, inspect mistake logs, and track AI priority rankings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#58a6ff] px-3.5 py-2 text-xs font-bold text-[#0b0f19] hover:bg-sky-400"
          >
            <Plus className="h-4 w-4" />
            Add Chapter
          </button>
          <button
            onClick={() => onRestoreCBSE(activeSubject)}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#161b22] px-3 py-2 text-xs font-bold text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]"
            title="Restore standard CBSE syllabus"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore CBSE
          </button>
        </div>
      </div>

      {/* Subject Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {SUBJECTS.map(sub => {
          const isActive = sub === activeSubject;
          const count = profile.subjects[sub]?.chapters?.length || 0;
          return (
            <button
              key={sub}
              onClick={() => setActiveSubject(sub)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'border-[#58a6ff] bg-[#58a6ff] text-[#0b0f19]'
                  : 'border-white/10 bg-[#161b22] text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]'
              }`}
            >
              <span>{sub}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive ? 'bg-[#0b0f19]/20 text-[#0b0f19] font-black' : 'bg-white/10 text-[#8b949e]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters & Sort Row */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'incomplete', 'completed', 'mistakes'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                filter === f
                  ? 'border-[#58a6ff] bg-[#58a6ff]/20 text-[#58a6ff]'
                  : 'border-white/10 bg-[#161b22] text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]'
              }`}
            >
              {f === 'all'
                ? 'All Chapters'
                : f === 'mistakes'
                ? '⚠️ With Mistakes'
                : f}
            </button>
          ))}

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 ml-1">
            <ArrowUpDown className="h-3 w-3 text-[#8b949e]" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-[#161b22] px-2.5 py-1.5 text-xs font-semibold text-[#f0f6fc]"
            >
              <option value="default">Default CBSE Order</option>
              <option value="priority">🔥 High Priority First</option>
              <option value="difficulty">Hardest Chapters First</option>
              <option value="incomplete">Least Completed First</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b949e]" />
          <input
            type="text"
            placeholder="Search chapter title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#161b22] py-1.5 pl-8 pr-3 text-xs text-[#f0f6fc] outline-none placeholder:text-[#8b949e]/50 focus:border-[#58a6ff]"
          />
        </div>
      </div>

      {/* Chapters Accordion List */}
      <div className="space-y-3">
        {filteredChapters.length === 0 ? (
          <div className="bento-card p-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-[#8b949e]" />
            <h3 className="mt-3 text-sm font-bold text-[#f0f6fc]">
              No chapters found in {activeSubject}
            </h3>
            <p className="mt-1 text-xs text-[#8b949e]">
              Try adjusting your filter or add custom chapters to this subject.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-xl bg-[#58a6ff] px-3 py-1.5 text-xs font-bold text-[#0b0f19]"
              >
                + Add Chapter
              </button>
              <button
                onClick={() => onRestoreCBSE(activeSubject)}
                className="rounded-xl border border-white/10 bg-[#161b22] px-3 py-1.5 text-xs font-bold text-[#8b949e]"
              >
                Restore CBSE Syllabus
              </button>
            </div>
          </div>
        ) : (
          filteredChapters.map(ch => {
            const isExpanded = !!expandedChapterIds[ch.id];
            const doneCount = ch.stageStates.slice(0, stagesList.length).filter(s => s === 2).length;
            const diff: ChapterDifficulty = ch.difficulty || 'Medium';
            const mistakesCount = getChapterMistakesCount(profile, activeSubject, ch.name);
            const { score, urgencyTag } = calculateChapterPriorityScore(ch, activeSubject, profile);

            // Difficulty styling
            let diffColor = 'border-amber-500/40 bg-amber-500/10 text-amber-300';
            if (diff === 'Hard') diffColor = 'border-rose-500/50 bg-rose-500/15 text-rose-300';
            if (diff === 'Easy') diffColor = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';

            return (
              <div
                key={ch.id}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  isExpanded
                    ? 'border-[#58a6ff]/40 bg-[#161b22]'
                    : 'border-white/10 bg-[#161b22] hover:border-white/20'
                }`}
              >
                {/* Chapter Accordion Header */}
                <div
                  onClick={() => toggleAccordion(ch.id)}
                  className="flex cursor-pointer items-center justify-between gap-3 p-4 select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`text-[#8b949e] transition-transform duration-200 shrink-0 ${
                        isExpanded ? 'rotate-90 text-[#58a6ff]' : ''
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </span>

                    <span className="text-sm font-bold text-[#f0f6fc] truncate sm:text-base">
                      {ch.name}
                    </span>

                    {/* Interactive Difficulty Tag */}
                    <button
                      type="button"
                      onClick={e => handleCycleDifficulty(e, ch.id, diff)}
                      className={`rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider transition-transform hover:scale-105 ${diffColor}`}
                      title="Click to toggle difficulty (Easy / Medium / Hard)"
                    >
                      {diff}
                    </button>

                    {/* Mistake Journal Badge */}
                    {mistakesCount > 0 && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onNavigateToMistakes?.(activeSubject, ch.name);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/30"
                        title="View errors logged for this chapter in Mistake Journal"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>{mistakesCount} Mistake{mistakesCount > 1 ? 's' : ''}</span>
                      </button>
                    )}

                    {/* Smart Priority Score Pill */}
                    {score >= 60 && (
                      <span
                        className={`hidden sm:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-black ${
                          score >= 80
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                        title={urgencyTag}
                      >
                        <Flame className="h-2.5 w-2.5 fill-current" />
                        Priority {score}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-[#8b949e]">
                      {doneCount}/{stagesList.length}
                    </span>

                    {/* Stage dots */}
                    <div className="flex items-center gap-1.5">
                      {stagesList.map((_, sIdx) => {
                        const st = ch.stageStates[sIdx] || 0;
                        const dotClass =
                          st === 2
                            ? 'bg-[#3fb950]'
                            : st === 1
                            ? 'bg-[#d29922]'
                            : 'bg-white/20';
                        return <span key={sIdx} className={`h-2 w-2 rounded-full ${dotClass}`} />;
                      })}
                    </div>
                  </div>
                </div>

                {/* Chapter Body (Stages + Actions) */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-[#0b0f19]/60 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[11px] font-bold text-[#8b949e]">
                      <span>
                        {stagesList.length} Preparation Stages • Click chip to cycle (Pending → In Progress → Done)
                      </span>
                      <span className="text-[#58a6ff]">
                        Smart Priority Ranking Score: {score}/100 ({urgencyTag})
                      </span>
                    </div>

                    {/* Stage Chips Grid */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {stagesList.map((stageTitle, sIdx) => {
                        const st = ch.stageStates[sIdx] || 0;
                        let chipBg = 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]';
                        let badgeText = 'Pending';
                        let badgeColor = 'text-[#8b949e]';
                        let icon = '○';

                        if (st === 2) {
                          chipBg = 'border-[#238636]/40 bg-[#238636]/15 text-[#3fb950]';
                          badgeText = 'Done';
                          badgeColor = 'text-[#3fb950]';
                          icon = '✓';
                        } else if (st === 1) {
                          chipBg = 'border-[#d29922]/40 bg-[#d29922]/15 text-[#d29922]';
                          badgeText = 'In Progress';
                          badgeColor = 'text-[#d29922]';
                          icon = '⏳';
                        }

                        return (
                          <div
                            key={sIdx}
                            onClick={() => onCycleStage(activeSubject, ch.id, sIdx)}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-bold transition-all select-none hover:scale-[1.01] ${chipBg}`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span>{icon}</span>
                              <span className="truncate">{stageTitle}</span>
                            </span>
                            <span className={`text-[10px] uppercase tracking-wider font-extrabold ${badgeColor}`}>
                              {badgeText}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Chapter Action Buttons */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onMarkAllDone(activeSubject, ch.id)}
                          className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-[#8b949e] hover:border-[#238636]/50 hover:text-[#3fb950]"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark All Done
                        </button>
                        <button
                          onClick={() => onResetStages(activeSubject, ch.id)}
                          className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reset Stages
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onNavigateToMistakes?.(activeSubject, ch.name)}
                          className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Log Mistake
                        </button>
                        <button
                          onClick={() => handleOpenRename(ch.id, ch.name)}
                          className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-[#8b949e] hover:border-[#58a6ff]/50 hover:text-[#58a6ff]"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Rename
                        </button>
                        <button
                          onClick={() => onCutChapter(activeSubject, ch.id)}
                          className="flex items-center gap-1 rounded-xl border border-[#f85149]/30 bg-[#f85149]/10 px-3 py-1.5 text-xs font-semibold text-[#f85149] hover:bg-[#f85149]/20"
                        >
                          <Scissors className="h-3.5 w-3.5" />
                          Cut Chapter
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Chapter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bento-card w-full max-w-md p-6 shadow-2xl">
            <div className="card-title m-0">
              <span>➕</span>
              <span>Add Chapter: {activeSubject}</span>
            </div>
            <p className="mt-1 text-xs text-[#8b949e]">
              Add any custom CBSE sub-topic, formula unit, or newly revised chapter.
            </p>
            <input
              type="text"
              autoFocus
              value={newChapterName}
              onChange={e => setNewChapterName(e.target.value)}
              placeholder="e.g. Surface Areas & Volumes - Section 2"
              className="mt-4 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-3 py-2 text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateChapter();
              }}
            />
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] py-2 text-xs font-bold text-[#8b949e] hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChapter}
                className="flex-1 rounded-xl bg-[#58a6ff] py-2 text-xs font-bold text-[#0b0f19] hover:bg-sky-400"
              >
                Add Chapter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Chapter Modal */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bento-card w-full max-w-md p-6 shadow-2xl">
            <div className="card-title m-0">
              <span>✏️</span>
              <span>Rename Chapter</span>
            </div>
            <p className="mt-1 text-xs text-[#8b949e]">Edit chapter title in {activeSubject}.</p>
            <input
              type="text"
              autoFocus
              value={renamedTitle}
              onChange={e => setRenamedTitle(e.target.value)}
              className="mt-4 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-3 py-2 text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveRename();
              }}
            />
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setEditingChapter(null)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] py-2 text-xs font-bold text-[#8b949e] hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="flex-1 rounded-xl bg-[#58a6ff] py-2 text-xs font-bold text-[#0b0f19] hover:bg-sky-400"
              >
                Save Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
