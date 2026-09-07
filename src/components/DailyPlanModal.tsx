import React, { useState } from 'react';
import { UserProfile, DailyPlan, DailyTask, EnergyLevel, SubjectName, PlanDiversityMode } from '../types';
import { generateDailyPlan } from '../utils/dailyPlanGenerator';
import { SUBJECTS, SUBJECT_COLORS } from '../data/cbseData';
import {
  Sparkles,
  Zap,
  Battery,
  BatteryCharging,
  Flame,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  RotateCcw,
  Clock,
  BookOpen,
  X,
  Layers,
  Check,
  Compass
} from 'lucide-react';

interface DailyPlanModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (plan: DailyPlan) => void;
  onSyncToCalendar: (tasks: DailyTask[]) => void;
  onEnergyChange?: (energy: EnergyLevel) => void;
}

export const DailyPlanModal: React.FC<DailyPlanModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSavePlan,
  onSyncToCalendar,
  onEnergyChange
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const existingPlan = profile.dailyPlans ? profile.dailyPlans[todayStr] : undefined;
  const initialEnergy = (profile.energyLevels && profile.energyLevels[todayStr]) || existingPlan?.energyLevel || 'Medium';
  const initialDiversity: PlanDiversityMode = existingPlan?.diversityMode || 'balanced';
  const initialFocus: SubjectName = existingPlan?.focusSubject || 'Mathematics';

  const [energy, setEnergy] = useState<EnergyLevel>(initialEnergy);
  const [diversityMode, setDiversityMode] = useState<PlanDiversityMode>(initialDiversity);
  const [focusSubject, setFocusSubject] = useState<SubjectName>(initialFocus);

  const [tasks, setTasks] = useState<DailyTask[]>(() => {
    if (existingPlan?.tasks && existingPlan.tasks.length > 0) {
      return existingPlan.tasks;
    }
    return generateDailyPlan(profile, initialEnergy, initialDiversity, initialFocus).tasks;
  });

  // Custom task form
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [customSubject, setCustomSubject] = useState<SubjectName>('Mathematics');
  const [customChapter, setCustomChapter] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customMinutes, setCustomMinutes] = useState(45);

  if (!isOpen) return null;

  const handleRegenerate = (
    selectedEnergy = energy,
    selectedDiversity = diversityMode,
    selectedFocus = focusSubject
  ) => {
    const freshPlan = generateDailyPlan(profile, selectedEnergy, selectedDiversity, selectedFocus);
    setTasks(freshPlan.tasks);
  };

  const handleEnergySelect = (lvl: EnergyLevel) => {
    setEnergy(lvl);
    onEnergyChange?.(lvl);
    handleRegenerate(lvl, diversityMode, focusSubject);
  };

  const handleDiversitySelect = (mode: PlanDiversityMode) => {
    setDiversityMode(mode);
    handleRegenerate(energy, mode, focusSubject);
  };

  const handleFocusSubjectSelect = (sub: SubjectName) => {
    setFocusSubject(sub);
    if (diversityMode === 'focus') {
      handleRegenerate(energy, 'focus', sub);
    }
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const nextVal = !(t.isCompleted ?? t.completed);
          return { ...t, completed: nextVal, isCompleted: nextVal };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleCreateCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newTask: DailyTask = {
      id: 'task_' + Date.now(),
      subject: customSubject,
      chapterName: customChapter.trim() || `${customSubject} Practice`,
      title: customTitle.trim(),
      taskTitle: customTitle.trim(),
      estimatedMinutes: customMinutes,
      completed: false,
      isCompleted: false,
      reason: 'Custom Goal',
      reasonTag: 'Custom Goal',
      scheduledTime: '15:00'
    };

    setTasks(prev => [...prev, newTask]);
    setCustomTitle('');
    setCustomChapter('');
    setIsAddingTask(false);
  };

  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const completedTasks = tasks.filter(t => t.isCompleted ?? t.completed).length;

  // Compute distinct subjects breakdown
  const subjectBreakdown = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.subject] = (acc[t.subject] || 0) + 1;
    return acc;
  }, {});
  const distinctSubjectsCount = Object.keys(subjectBreakdown).length;

  const handleSaveAndApply = () => {
    const finalPlan: DailyPlan = {
      date: todayStr,
      energyLevel: energy,
      diversityMode,
      focusSubject: diversityMode === 'focus' ? focusSubject : undefined,
      tasks: tasks.map(t => ({
        ...t,
        title: t.title || t.taskTitle || 'Study Task',
        isCompleted: t.isCompleted ?? t.completed ?? false
      })),
      generatedAt: new Date().toISOString(),
      targetTotalMinutes: totalMinutes,
      targetHours: Number((totalMinutes / 60).toFixed(1))
    };
    onSavePlan(finalPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d1117] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#161b22] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#58a6ff] to-[#388bfd] text-slate-950 font-black">
              <Sparkles className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#f0f6fc] sm:text-lg">
                Auto Daily Plan Generator
              </h2>
              <p className="text-xs text-[#8b949e]">
                Smart multi-subject scheduler based on CBSE datesheet, difficulty & energy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#8b949e] hover:bg-white/5 hover:text-[#f0f6fc]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Energy Check-in Selector */}
          <div className="rounded-2xl border border-white/10 bg-[#161b22] p-3.5 sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#f0f6fc]">
                Daily Energy Level Check-in
              </span>
              <span className="text-[11px] text-[#8b949e]">
                Adapts task load and session length
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleEnergySelect('Low')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                  energy === 'Low'
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-sm'
                    : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20'
                }`}
              >
                <Battery className="h-4 w-4 text-emerald-400" />
                <span>Low (Light: 3 Tasks)</span>
              </button>

              <button
                type="button"
                onClick={() => handleEnergySelect('Medium')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                  energy === 'Medium'
                    ? 'border-sky-500/60 bg-sky-500/20 text-sky-300 shadow-sm'
                    : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20'
                }`}
              >
                <BatteryCharging className="h-4 w-4 text-sky-400" />
                <span>Medium (Steady: 5 Tasks)</span>
              </button>

              <button
                type="button"
                onClick={() => handleEnergySelect('High')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                  energy === 'High'
                    ? 'border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm'
                    : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20'
                }`}
              >
                <Flame className="h-4 w-4 text-amber-400 fill-current" />
                <span>High (Sprint: 6 Tasks)</span>
              </button>
            </div>
          </div>

          {/* Subject Distribution Strategy */}
          <div className="rounded-2xl border border-white/10 bg-[#161b22] p-3.5 sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#f0f6fc]">
                Subject Distribution Strategy
              </span>
              <span className="text-[11px] font-semibold text-[#58a6ff]">
                Prevents 1-Subject Stalling
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDiversitySelect('balanced')}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                  diversityMode === 'balanced'
                    ? 'border-[#58a6ff]/60 bg-[#58a6ff]/15 text-[#f0f6fc]'
                    : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Compass className="h-3.5 w-3.5 text-[#58a6ff]" />
                  <span>Balanced Mix</span>
                </div>
                <span className="text-[10px] text-[#8b949e] mt-1 leading-snug">
                  Rotates 3–4 subjects (Max 2 tasks per subject)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDiversitySelect('dual')}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                  diversityMode === 'dual'
                    ? 'border-[#58a6ff]/60 bg-[#58a6ff]/15 text-[#f0f6fc]'
                    : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Layers className="h-3.5 w-3.5 text-purple-400" />
                  <span>Dual Subjects</span>
                </div>
                <span className="text-[10px] text-[#8b949e] mt-1 leading-snug">
                  Focus on top 2 urgent subjects
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDiversitySelect('focus')}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                  diversityMode === 'focus'
                    ? 'border-amber-500/60 bg-amber-500/15 text-[#f0f6fc]'
                    : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Single Focus</span>
                </div>
                <span className="text-[10px] text-[#8b949e] mt-1 leading-snug">
                  Deep dive into 1 subject (Exam preps)
                </span>
              </button>
            </div>

            {/* If Single Focus, subject dropdown */}
            {diversityMode === 'focus' && (
              <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                <label className="text-xs font-semibold text-[#8b949e] shrink-0">
                  Target Subject:
                </label>
                <select
                  value={focusSubject}
                  onChange={e => handleFocusSubjectSelect(e.target.value as SubjectName)}
                  className="rounded-lg border border-white/10 bg-[#0d1117] px-2.5 py-1 text-xs font-semibold text-[#f0f6fc] focus:border-[#58a6ff]"
                >
                  {SUBJECTS.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Active Multi-Subject Breakdown Strip */}
          <div className="rounded-2xl border border-white/10 bg-[#161b22] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#f0f6fc]">
                <span>📚</span>
                <span>
                  {distinctSubjectsCount} Subject{distinctSubjectsCount === 1 ? '' : 's'} in Today's Plan:
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#8b949e]">
                {tasks.length} total tasks • {(totalMinutes / 60).toFixed(1)} hrs
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {Object.entries(subjectBreakdown).map(([sub, count]) => {
                const color = SUBJECT_COLORS[sub as SubjectName] || {
                  accent: '#38bdf8',
                  bg: 'bg-sky-500/10'
                };
                return (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: `${color.accent}15`,
                      color: color.accent,
                      border: `1px solid ${color.accent}30`
                    }}
                  >
                    <span>{sub}</span>
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-[#0b0f19] font-black"
                      style={{ backgroundColor: color.accent }}
                    >
                      {count}
                    </span>
                  </span>
                );
              })}
            </div>

            {diversityMode === 'balanced' && distinctSubjectsCount > 1 && (
              <p className="mt-2 text-[11px] text-[#3fb950] font-medium flex items-center gap-1">
                <Check className="h-3 w-3 inline" />
                Interleaved rotation balances hard problem-solving with conceptual revision across all 7 subjects.
              </p>
            )}
          </div>

          {/* Tasks List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">
                Scheduled Daily Quests
              </span>
              <span className="text-xs font-bold text-[#3fb950]">
                {completedTasks}/{tasks.length} Completed
              </span>
            </div>

            {tasks.map((task, idx) => {
              const isDone = task.isCompleted ?? task.completed ?? false;
              const color = SUBJECT_COLORS[task.subject] || {
                accent: '#38bdf8',
                bg: 'bg-sky-500/10',
                text: 'text-sky-400'
              };

              return (
                <div
                  key={task.id}
                  className={`group flex items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                    isDone
                      ? 'border-emerald-500/30 bg-emerald-500/10 opacity-75'
                      : 'border-white/10 bg-[#161b22] hover:border-white/20'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className="mt-0.5 shrink-0"
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-all ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950 font-black'
                          : 'border-white/20 bg-white/5 hover:border-[#58a6ff]'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: `${color.accent}20`,
                          color: color.accent
                        }}
                      >
                        {task.subject}
                      </span>
                      {(task.reasonTag || task.reason) && (
                        <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-[#8b949e]">
                          {task.reasonTag || task.reason}
                        </span>
                      )}
                      {task.scheduledTime && (
                        <span className="rounded-md bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-[#8b949e] font-mono">
                          ⏰ {task.scheduledTime}
                        </span>
                      )}
                      <span className="text-[10px] text-[#8b949e] ml-auto font-medium">
                        ⏱️ {task.estimatedMinutes} mins
                      </span>
                    </div>

                    <p
                      className={`text-xs sm:text-sm font-semibold text-[#f0f6fc] leading-snug ${
                        isDone ? 'line-through text-[#8b949e]' : ''
                      }`}
                    >
                      {task.title || task.taskTitle}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#8b949e] hover:text-rose-400 transition-opacity"
                    title="Remove task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Custom Task Form or Action Buttons */}
          {isAddingTask ? (
            <form
              onSubmit={handleCreateCustomTask}
              className="rounded-2xl border border-[#58a6ff]/40 bg-[#161b22] p-4 space-y-3"
            >
              <div className="text-xs font-bold text-[#f0f6fc]">
                Add Custom Goal for Today
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold text-[#8b949e] uppercase">
                    Subject
                  </label>
                  <select
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value as SubjectName)}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-[#0d1117] p-2 text-xs text-[#f0f6fc]"
                  >
                    {SUBJECTS.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8b949e] uppercase">
                    Estimated Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={customMinutes}
                    onChange={e => setCustomMinutes(Number(e.target.value))}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-[#0d1117] p-2 text-xs text-[#f0f6fc]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#8b949e] uppercase">
                  Chapter / Topic Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quadratic Equations"
                  value={customChapter}
                  onChange={e => setCustomChapter(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-white/10 bg-[#0d1117] p-2 text-xs text-[#f0f6fc]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#8b949e] uppercase">
                  Specific Goal / Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solve Exercise 4.3 Word Problems (1-7)"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-white/10 bg-[#0d1117] p-2 text-xs text-[#f0f6fc]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="rounded-xl px-3 py-1.5 text-xs text-[#8b949e] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#58a6ff] px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-400"
                >
                  Add Task
                </button>
              </div>
            </form>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddingTask(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] py-2.5 text-xs font-bold text-[#8b949e] hover:border-white/40 hover:text-[#f0f6fc]"
              >
                <Plus className="h-4 w-4" />
                Add Custom Task
              </button>
              <button
                type="button"
                onClick={() => handleRegenerate()}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161b22] px-4 py-2.5 text-xs font-bold text-[#8b949e] hover:text-[#f0f6fc]"
                title="Regenerate plan with multi-subject balance"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 bg-[#161b22] p-4">
          <button
            type="button"
            onClick={() => {
              onSyncToCalendar(tasks);
            }}
            className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-400 hover:bg-sky-500/20"
          >
            <Calendar className="h-3.5 w-3.5" />
            Schedule to Calendar
          </button>

          <div className="flex w-full sm:w-auto gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-[#238636] px-5 py-2 text-xs font-bold text-white hover:bg-green-600 shadow-md shadow-green-900/30"
            >
              <CheckCircle2 className="h-4 w-4" />
              Apply Today's Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
