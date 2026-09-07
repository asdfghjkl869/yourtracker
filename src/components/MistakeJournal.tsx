import React, { useState } from 'react';
import { UserProfile, MistakeEntry, MistakeReason, SubjectName } from '../types';
import { SUBJECTS, SUBJECT_COLORS } from '../data/cbseData';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Filter,
  Lightbulb,
  Tag,
  BookOpen,
  HelpCircle,
  TrendingDown,
  Check,
  X
} from 'lucide-react';

interface MistakeJournalProps {
  profile: UserProfile;
  initialSubject?: SubjectName;
  initialChapter?: string;
  onAddMistake: (entry: Omit<MistakeEntry, 'id'>) => void;
  onToggleResolved: (id: string) => void;
  onDeleteMistake: (id: string) => void;
  onNavigateToChapter?: (subject: SubjectName, chapterName: string) => void;
}

export const REASONS_LIST: MistakeReason[] = [
  'Conceptual Gap',
  'Careless Error',
  'Formula / Derivation',
  'Calculation Mistake',
  'Time Pressure',
  'Misread Question',
  'Memory Gap'
];

export const MistakeJournal: React.FC<MistakeJournalProps> = ({
  profile,
  initialSubject,
  initialChapter,
  onAddMistake,
  onToggleResolved,
  onDeleteMistake,
  onNavigateToChapter
}) => {
  const mistakes = profile.mistakes || [];

  // Filter state
  const [selectedSubject, setSelectedSubject] = useState<SubjectName | 'All'>(initialSubject || 'All');
  const [selectedReason, setSelectedReason] = useState<MistakeReason | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState(initialChapter || '');
  const [showOnlyUnresolved, setShowOnlyUnresolved] = useState(false);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formSubject, setFormSubject] = useState<SubjectName>('Mathematics');
  const [formChapter, setFormChapter] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSolution, setFormSolution] = useState('');
  const [formReason, setFormReason] = useState<MistakeReason>('Calculation Mistake');

  // Available chapters for the selected form subject
  const currentSubjectChapters = profile.subjects[formSubject]?.chapters || [];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim() || !formSolution.trim()) return;

    onAddMistake({
      date: new Date().toISOString().split('T')[0],
      subject: formSubject,
      chapterName: formChapter.trim() || `${formSubject} Chapter`,
      description: formDescription.trim(),
      solution: formSolution.trim(),
      reason: formReason,
      resolved: false
    });

    setFormDescription('');
    setFormSolution('');
    setIsAddModalOpen(false);
  };

  // Filter logic
  const filteredMistakes = mistakes.filter(m => {
    if (selectedSubject !== 'All' && m.subject !== selectedSubject) return false;
    if (selectedReason !== 'All' && m.reason !== selectedReason) return false;
    if (showOnlyUnresolved && m.resolved) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText =
        m.chapterName.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.solution.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q);
      if (!matchText) return false;
    }
    return true;
  });

  // Calculate statistics
  const totalCount = mistakes.length;
  const unresolvedCount = mistakes.filter(m => !m.resolved).length;
  
  // Frequency by reason
  const reasonCounts: Record<string, number> = {};
  mistakes.forEach(m => {
    reasonCounts[m.reason] = (reasonCounts[m.reason] || 0) + 1;
  });
  const topReasonEntry = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="card-title m-0 mb-1">
            <span>📓</span>
            <span>Error Diagnostics & Retention</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#f0f6fc] sm:text-3xl">
            Mistake Journal
          </h2>
          <p className="text-xs text-[#8b949e] sm:text-sm">
            Track careless errors, formula slips & conceptual traps so you never repeat them in exams.
          </p>
        </div>

        <button
          onClick={() => {
            if (currentSubjectChapters[0]) {
              setFormChapter(currentSubjectChapters[0].name);
            }
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#d29922] px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-950/20"
        >
          <Plus className="h-4 w-4" />
          Log New Mistake
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="bento-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8b949e]">
            Unresolved Mistakes
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#d29922]">{unresolvedCount}</span>
            <span className="text-xs text-[#8b949e]">/ {totalCount} total logged</span>
          </div>
          <p className="mt-1 text-[11px] text-[#8b949e]">
            Directly boosts chapter priority score in daily plans.
          </p>
        </div>

        <div className="bento-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8b949e]">
            Top Error Category
          </div>
          <div className="mt-1.5 text-lg font-black text-[#f0f6fc] truncate">
            {topReasonEntry ? topReasonEntry[0] : 'None logged'}
          </div>
          <p className="mt-1 text-[11px] text-[#58a6ff]">
            {topReasonEntry ? `${topReasonEntry[1]} instances logged` : 'No errors logged yet!'}
          </p>
        </div>

        <div className="bento-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8b949e]">
            Mastery Goal
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-3xl font-black text-[#3fb950]">
              {totalCount > 0 ? Math.round(((totalCount - unresolvedCount) / totalCount) * 100) : 100}%
            </span>
            <span className="text-xs font-semibold text-[#8b949e]">Resolved Rate</span>
          </div>
          <p className="mt-1 text-[11px] text-[#8b949e]">
            Review corrected solutions before test days.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#161b22] p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b949e]" />
          <input
            type="text"
            placeholder="Search by topic, mistake note, or formula..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0d1117] py-2 pl-9 pr-3 text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none"
          />
        </div>

        {/* Subject Filter */}
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value as SubjectName | 'All')}
          className="rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-xs font-semibold text-[#f0f6fc]"
        >
          <option value="All">All Subjects</option>
          {SUBJECTS.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Reason Filter */}
        <select
          value={selectedReason}
          onChange={e => setSelectedReason(e.target.value as MistakeReason | 'All')}
          className="rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-xs font-semibold text-[#f0f6fc]"
        >
          <option value="All">All Reason Tags</option>
          {REASONS_LIST.map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Unresolved only toggle */}
        <button
          onClick={() => setShowOnlyUnresolved(!showOnlyUnresolved)}
          className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
            showOnlyUnresolved
              ? 'border-[#d29922] bg-[#d29922]/20 text-[#d29922]'
              : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:text-[#f0f6fc]'
          }`}
        >
          {showOnlyUnresolved ? '⚠️ Unresolved Only' : 'Show All'}
        </button>
      </div>

      {/* Mistakes List */}
      {filteredMistakes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#161b22]/40 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl mb-3">
            🎯
          </div>
          <h3 className="text-base font-bold text-[#f0f6fc]">No Mistakes Found</h3>
          <p className="mt-1 max-w-sm text-xs text-[#8b949e]">
            {mistakes.length === 0
              ? 'Great work! As you practice NCERT questions or test papers, log tricky questions here to review before boards.'
              : 'No mistakes match your current filter settings.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 rounded-xl bg-[#58a6ff] px-4 py-2 text-xs font-bold text-slate-950"
          >
            Log First Mistake
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredMistakes.map(entry => {
            const color = SUBJECT_COLORS[entry.subject] || {
              accent: '#38bdf8',
              bg: 'bg-sky-500/10',
              text: 'text-sky-400'
            };

            return (
              <div
                key={entry.id}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  entry.resolved
                    ? 'border-white/10 bg-[#161b22]/50 opacity-80'
                    : 'border-[#d29922]/30 bg-[#161b22] shadow-lg shadow-black/20'
                }`}
              >
                <div className="p-4 sm:p-5">
                  {/* Top row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-lg px-2 py-0.5 text-xs font-extrabold"
                        style={{
                          backgroundColor: `${color.accent}20`,
                          color: color.accent
                        }}
                      >
                        {entry.subject}
                      </span>
                      <span className="text-xs font-bold text-[#f0f6fc]">
                        {entry.chapterName}
                      </span>
                      <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        {entry.reason}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#8b949e]">{entry.date}</span>

                      <button
                        onClick={() => onToggleResolved(entry.id)}
                        className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                          entry.resolved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/5 text-[#8b949e] hover:text-[#f0f6fc] border border-white/10'
                        }`}
                        title="Toggle resolved status"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {entry.resolved ? 'Resolved' : 'Mark Resolved'}
                      </button>

                      <button
                        onClick={() => onDeleteMistake(entry.id)}
                        className="p-1 text-[#8b949e] hover:text-rose-400 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Two column description & solution */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                    {/* What went wrong */}
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>The Mistake Made</span>
                      </div>
                      <p className="text-xs text-[#f0f6fc] whitespace-pre-wrap leading-relaxed">
                        {entry.description}
                      </p>
                    </div>

                    {/* How to solve correctly */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                        <Lightbulb className="h-3.5 w-3.5" />
                        <span>Correct Formula / Concept to Remember</span>
                      </div>
                      <p className="text-xs text-[#f0f6fc] whitespace-pre-wrap leading-relaxed">
                        {entry.solution}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Mistake Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d1117] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-[#f0f6fc]">
                  Log Problem or Mistake
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8b949e] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8b949e]">
                    Subject
                  </label>
                  <select
                    value={formSubject}
                    onChange={e => {
                      const newSub = e.target.value as SubjectName;
                      setFormSubject(newSub);
                      const chs = profile.subjects[newSub]?.chapters || [];
                      if (chs[0]) setFormChapter(chs[0].name);
                    }}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-[#161b22] p-2 text-xs text-[#f0f6fc]"
                  >
                    {SUBJECTS.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8b949e]">
                    Reason Tag
                  </label>
                  <select
                    value={formReason}
                    onChange={e => setFormReason(e.target.value as MistakeReason)}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-[#161b22] p-2 text-xs text-[#f0f6fc]"
                  >
                    {REASONS_LIST.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#8b949e]">
                  Chapter Name
                </label>
                <select
                  value={formChapter}
                  onChange={e => setFormChapter(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-white/10 bg-[#161b22] p-2 text-xs text-[#f0f6fc]"
                >
                  {currentSubjectChapters.map(ch => (
                    <option key={ch.id} value={ch.name}>
                      {ch.name}
                    </option>
                  ))}
                  <option value="General Revision">Other / General Revision</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-rose-400">
                  What was the mistake? (Describe the error)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. In Question 7, applied b² + 4ac instead of b² - 4ac for discriminant, yielding imaginary roots wrongly."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-white/10 bg-[#161b22] p-2.5 text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-emerald-400">
                  Correct Solution / Rule to Remember
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Discriminant D = b² - 4ac. When a and c have opposite signs, -4ac is positive! Always write formula before plugging in."
                  value={formSolution}
                  onChange={e => setFormSolution(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-white/10 bg-[#161b22] p-2.5 text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#d29922] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md"
                >
                  Save Mistake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
