import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  DailyPlan,
  DailyTask,
  EnergyLevel,
  SubjectName,
  PlanDiversityMode,
  StageFocusCategory
} from '../types';
import { generateDailyPlan } from '../utils/dailyPlanGenerator';
import { SUBJECTS, SUBJECT_COLORS, DEFAULT_STAGES } from '../data/cbseData';
import { getLocalDateString } from '../utils/helpers';
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
  Compass,
  ChevronDown,
  Sliders,
  Filter
} from 'lucide-react';

interface DailyPlanModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (plan: DailyPlan) => void;
  onSyncToCalendar: (tasks: DailyTask[]) => void;
  onEnergyChange?: (energy: EnergyLevel) => void;
}

const STAGE_PRESETS: { id: StageFocusCategory; label: string; icon: string; desc: string }[] = [
  { id: 'all', label: 'All Stages', icon: '🎯', desc: 'Auto sequence based on pending syllabus' },
  { id: 'in_progress', label: 'In-Progress Only', icon: '⏳', desc: 'Finish started chapters & stages' },
  { id: 'theory', label: 'Lectures & Concepts', icon: '📖', desc: 'Formulas, One-Shots & Theory' },
  { id: 'ncert', label: 'NCERT Practice', icon: '✏️', desc: 'Textbook line-by-line & standard exercises' },
  { id: 'advanced', label: 'Exemplar & HOTS', icon: '🚀', desc: 'Modules, reference problems & depth' },
  { id: 'practice', label: 'PYQs & Board Mocks', icon: '📝', desc: 'Board question banks & sample papers' },
  { id: 'custom', label: 'Select Subject Stages', icon: '⚙️', desc: 'Pick exact stages to target per subject' }
];

export const DailyPlanModal: React.FC<DailyPlanModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSavePlan,
  onSyncToCalendar,
  onEnergyChange
}) => {
  const todayStr = getLocalDateString(new Date());
  const existingPlan = profile.dailyPlans ? profile.dailyPlans[todayStr] : undefined;
  const initialEnergy: EnergyLevel =
    profile.energyLevel ||
    (profile.energyLevels && profile.energyLevels[todayStr]) ||
    existingPlan?.energyLevel ||
    'Medium';
  const initialDiversity: PlanDiversityMode = existingPlan?.diversityMode || 'balanced';
  const initialFocus: SubjectName = existingPlan?.focusSubject || 'Mathematics';
  const initialStageFocus: StageFocusCategory = existingPlan?.stageFocus || 'all';
  const initialSelectedStages: string[] = existingPlan?.selectedStages || [];

  const [energy, setEnergy] = useState<EnergyLevel>(initialEnergy);
  const [diversityMode, setDiversityMode] = useState<PlanDiversityMode>(initialDiversity);
  const [focusSubject, setFocusSubject] = useState<SubjectName>(initialFocus);
  const [stageFocus, setStageFocus] = useState<StageFocusCategory>(initialStageFocus);
  const [selectedCustomStages, setSelectedCustomStages] = useState<string[]>(initialSelectedStages);
  const [showCustomStageSelector, setShowCustomStageSelector] = useState<boolean>(initialStageFocus === 'custom');
  const [stagePickerSubject, setStagePickerSubject] = useState<SubjectName>(initialFocus);
  const [openStageMenuTaskId, setOpenStageMenuTaskId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedFeedback, setGeneratedFeedback] = useState<string | null>(null);

  const [tasks, setTasks] = useState<DailyTask[]>(() => {
    if (existingPlan?.tasks && existingPlan.tasks.length > 0) {
      return existingPlan.tasks;
    }
    return generateDailyPlan(
      profile,
      initialEnergy,
      initialDiversity,
      initialFocus,
      initialStageFocus,
      initialSelectedStages
    ).tasks;
  });

  // Keep energy & tasks synced whenever modal opens or profile dailyPlans updates
  useEffect(() => {
    if (isOpen) {
      const currentSelectedEnergy: EnergyLevel =
        profile.energyLevel ||
        (profile.energyLevels && profile.energyLevels[todayStr]) ||
        existingPlan?.energyLevel ||
        'Medium';
      setEnergy(currentSelectedEnergy);

      const plan = profile.dailyPlans?.[todayStr];
      if (plan?.tasks && plan.tasks.length > 0) {
        setTasks(plan.tasks);
      }
    }
  }, [isOpen, profile.energyLevel, profile.dailyPlans, todayStr]);

  // Custom task form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [customSubject, setCustomSubject] = useState<SubjectName>('Mathematics');
  const [customChapter, setCustomChapter] = useState('');
  const [customStage, setCustomStage] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customMinutes, setCustomMinutes] = useState(45);

  // Sync customStage default when customSubject changes
  useEffect(() => {
    const stages = profile.customStages[customSubject] || DEFAULT_STAGES[customSubject] || [];
    if (stages.length > 0 && !customStage) {
      setCustomStage(stages[0]);
    }
  }, [customSubject, profile.customStages, customStage]);

  if (!isOpen) return null;

  const handleRegenerate = (
    selectedEnergy = energy,
    selectedDiversity = diversityMode,
    selectedFocus = focusSubject,
    selectedStageFocus = stageFocus,
    selectedStages = selectedCustomStages
  ) => {
    setIsGenerating(true);
    const freshPlan = generateDailyPlan(
      profile,
      selectedEnergy,
      selectedDiversity,
      selectedFocus,
      selectedStageFocus,
      selectedStages
    );
    setTasks(freshPlan.tasks);
    setOpenStageMenuTaskId(null);
    const hours = (freshPlan.targetTotalMinutes / 60).toFixed(1);
    setGeneratedFeedback(`✨ Generated plan: ${freshPlan.tasks.length} tasks (${hours}h) for ${selectedEnergy} Energy!`);
    setTimeout(() => {
      setIsGenerating(false);
    }, 250);
    setTimeout(() => {
      setGeneratedFeedback(prev => (prev?.includes(`${freshPlan.tasks.length} tasks`) ? null : prev));
    }, 3500);
  };

  const handleEnergySelect = (lvl: EnergyLevel) => {
    setEnergy(lvl);
    onEnergyChange?.(lvl);
    handleRegenerate(lvl, diversityMode, focusSubject, stageFocus, selectedCustomStages);
  };

  const handleDiversitySelect = (mode: PlanDiversityMode) => {
    setDiversityMode(mode);
    handleRegenerate(energy, mode, focusSubject, stageFocus, selectedCustomStages);
  };

  const handleFocusSubjectSelect = (sub: SubjectName) => {
    setFocusSubject(sub);
    setStagePickerSubject(sub);
    if (diversityMode === 'focus') {
      handleRegenerate(energy, 'focus', sub, stageFocus, selectedCustomStages);
    }
  };

  const handleStageFocusSelect = (focusCat: StageFocusCategory) => {
    setStageFocus(focusCat);
    if (focusCat === 'custom') {
      setShowCustomStageSelector(true);
      if (selectedCustomStages.length === 0) {
        const defaultStagesForSub = profile.customStages[stagePickerSubject] || DEFAULT_STAGES[stagePickerSubject] || [];
        const preselected = defaultStagesForSub.slice(0, 2);
        setSelectedCustomStages(preselected);
        handleRegenerate(energy, diversityMode, focusSubject, 'custom', preselected);
        return;
      }
    }
    handleRegenerate(energy, diversityMode, focusSubject, focusCat, selectedCustomStages);
  };

  const handleToggleCustomStage = (stageName: string) => {
    let updated: string[];
    if (selectedCustomStages.includes(stageName)) {
      updated = selectedCustomStages.filter(s => s !== stageName);
    } else {
      updated = [...selectedCustomStages, stageName];
    }
    setSelectedCustomStages(updated);
    setStageFocus('custom');
    handleRegenerate(energy, diversityMode, focusSubject, 'custom', updated);
  };

  const handleSelectAllStagesForSubject = (sub: SubjectName) => {
    const stages = profile.customStages[sub] || DEFAULT_STAGES[sub] || [];
    const combined = Array.from(new Set([...selectedCustomStages, ...stages]));
    setSelectedCustomStages(combined);
    setStageFocus('custom');
    handleRegenerate(energy, diversityMode, focusSubject, 'custom', combined);
  };

  const handleClearStagesForSubject = (sub: SubjectName) => {
    const stages = profile.customStages[sub] || DEFAULT_STAGES[sub] || [];
    const remaining = selectedCustomStages.filter(s => !stages.includes(s));
    setSelectedCustomStages(remaining);
    setStageFocus('custom');
    handleRegenerate(energy, diversityMode, focusSubject, 'custom', remaining);
  };

  const handleSelectTaskStage = (taskId: string, newStageName: string, newStageIndex: number) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updatedTitle = `${newStageName} — ${t.chapterName}`;
          return {
            ...t,
            stageName: newStageName,
            stageIndex: newStageIndex,
            title: updatedTitle,
            taskTitle: updatedTitle
          };
        }
        return t;
      })
    );
    setOpenStageMenuTaskId(null);
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

    const stages = profile.customStages[customSubject] || DEFAULT_STAGES[customSubject] || [];
    const stageIdx = stages.findIndex(s => s === customStage);

    const newTask: DailyTask = {
      id: 'task_' + Date.now(),
      subject: customSubject,
      chapterName: customChapter.trim() || `${customSubject} Practice`,
      title: customTitle.trim(),
      taskTitle: customTitle.trim(),
      stageName: customStage || 'Practice',
      stageIndex: stageIdx >= 0 ? stageIdx : 0,
      estimatedMinutes: customMinutes,
      completed: false,
      isCompleted: false,
      reason: 'Custom Goal',
      reasonTag: customStage ? `Stage: ${customStage}` : 'Custom Goal',
      scheduledTime: '15:00'
    };

    setTasks(prev => [...prev, newTask]);
    setCustomTitle('');
    setCustomChapter('');
    setIsAddingTask(false);
  };

  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const completedTasks = tasks.filter(t => t.isCompleted ?? t.completed).length;

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
      stageFocus,
      selectedStages: selectedCustomStages,
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

  const currentSubjectStages = profile.customStages[stagePickerSubject] || DEFAULT_STAGES[stagePickerSubject] || [];
  const customSubChapters = profile.subjects[customSubject]?.chapters || [];
  const customSubStages = profile.customStages[customSubject] || DEFAULT_STAGES[customSubject] || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      onClick={() => setOpenStageMenuTaskId(null)}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
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
                Smart multi-subject scheduler based on CBSE datesheet, subject stages & energy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-[#8b949e] hover:bg-white/5 hover:text-[#f0f6fc]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Visual Generation Feedback Banner */}
          {generatedFeedback && (
            <div className="flex items-center justify-between rounded-xl border border-sky-500/40 bg-sky-500/10 px-3.5 py-2.5 text-xs font-semibold text-sky-200 transition-all">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-sky-400 animate-pulse" />
                <span>{generatedFeedback}</span>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedFeedback(null)}
                className="text-xs text-sky-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Energy Check-in Selector */}
          <div className="rounded-2xl border border-white/10 bg-[#161b22] p-3.5 sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#f0f6fc]">
                Daily Energy Level
              </span>
              <span className="text-[11px] text-[#8b949e]">
                Determines session duration and volume
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
                <span>Low (3 Tasks)</span>
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
                <span>Medium (5 Tasks)</span>
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
                <span>High (6 Tasks)</span>
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
                Multi-Subject Rotation
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

          {/* Target Stages / Subject Stages Selection Section */}
          <div className="rounded-2xl border border-white/10 bg-[#161b22] p-3.5 sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-[#58a6ff]" />
                <span className="text-xs font-bold text-[#f0f6fc]">
                  Select Target Subject Stages
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomStageSelector(prev => !prev)}
                className="text-[11px] font-semibold text-[#58a6ff] hover:underline"
              >
                {showCustomStageSelector ? 'Hide Stage Checklist' : 'Custom Stage Checklist'}
              </button>
            </div>

            {/* Stage Quick Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
              {STAGE_PRESETS.slice(0, 4).map(preset => {
                const isSelected = stageFocus === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleStageFocusSelect(preset.id)}
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left transition-all ${
                      isSelected
                        ? 'border-[#58a6ff]/60 bg-[#58a6ff]/15 text-[#f0f6fc]'
                        : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs">{preset.icon}</span>
                    <span className="text-[11px] font-bold truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {STAGE_PRESETS.slice(4).map(preset => {
                const isSelected = stageFocus === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleStageFocusSelect(preset.id)}
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left transition-all ${
                      isSelected
                        ? 'border-[#58a6ff]/60 bg-[#58a6ff]/15 text-[#f0f6fc]'
                        : 'border-white/10 bg-white/[0.02] text-[#8b949e] hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs">{preset.icon}</span>
                    <span className="text-[11px] font-bold truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Subject Stages Checklist Drawer */}
            {(showCustomStageSelector || stageFocus === 'custom') && (
              <div className="mt-3.5 rounded-xl border border-white/10 bg-[#0d1117] p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#8b949e] uppercase">
                      Select Subject to View Stages:
                    </span>
                    <select
                      value={stagePickerSubject}
                      onChange={e => setStagePickerSubject(e.target.value as SubjectName)}
                      className="rounded-lg border border-white/10 bg-[#161b22] px-2 py-0.5 text-xs font-bold text-[#f0f6fc] focus:border-[#58a6ff]"
                    >
                      {SUBJECTS.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllStagesForSubject(stagePickerSubject)}
                      className="text-[10px] font-semibold text-[#58a6ff] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-[#8b949e] text-[10px]">•</span>
                    <button
                      type="button"
                      onClick={() => handleClearStagesForSubject(stagePickerSubject)}
                      className="text-[10px] font-semibold text-rose-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Stage pills for active subject */}
                <div>
                  <p className="text-[11px] text-[#8b949e] mb-2">
                    Click to include or exclude specific stages for <strong className="text-[#f0f6fc]">{stagePickerSubject}</strong>:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSubjectStages.map((stageName, idx) => {
                      const isSelected = selectedCustomStages.includes(stageName);
                      return (
                        <button
                          key={stageName}
                          type="button"
                          onClick={() => handleToggleCustomStage(stageName)}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                            isSelected
                              ? 'border-[#58a6ff] bg-[#58a6ff]/20 text-[#f0f6fc] shadow-sm'
                              : 'border-white/10 bg-white/[0.03] text-[#8b949e] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          <span
                            className={`flex h-3.5 w-3.5 items-center justify-center rounded text-[9px] font-bold ${
                              isSelected ? 'bg-[#58a6ff] text-slate-950' : 'bg-white/10 text-[#8b949e]'
                            }`}
                          >
                            {isSelected ? '✓' : idx + 1}
                          </span>
                          <span>{stageName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedCustomStages.length > 0 && (
                  <div className="text-[11px] text-[#3fb950] font-medium flex items-center gap-1.5 pt-1">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Active filter: Prioritizing <strong>{selectedCustomStages.length}</strong> selected stages across subjects.
                    </span>
                  </div>
                )}
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
                Multi-subject interleaving prevents single-subject syllabus stalls.
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

            {tasks.map((task) => {
              const isDone = task.isCompleted ?? task.completed ?? false;
              const color = SUBJECT_COLORS[task.subject] || {
                accent: '#38bdf8',
                bg: 'bg-sky-500/10',
                text: 'text-sky-400'
              };
              const subjectStages = profile.customStages[task.subject] || DEFAULT_STAGES[task.subject] || [];
              const chapterObj = profile.subjects[task.subject]?.chapters?.find(
                c => c.id === task.chapterId || c.name === task.chapterName
              );

              return (
                <div
                  key={task.id}
                  className={`group relative flex items-start gap-3 rounded-2xl border p-3.5 transition-all ${
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
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: `${color.accent}20`,
                          color: color.accent
                        }}
                      >
                        {task.subject}
                      </span>

                      {/* Interactive Stage Selector Dropdown */}
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenStageMenuTaskId(openStageMenuTaskId === task.id ? null : task.id);
                          }}
                          className="flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-[#f0f6fc] hover:border-[#58a6ff] hover:bg-[#58a6ff]/10 transition-colors"
                          title="Click to switch this chapter's stage"
                        >
                          <span className="text-[#8b949e]">Stage:</span>
                          <span className="font-bold text-[#58a6ff] truncate max-w-[130px]">
                            {task.stageName || 'Select Stage'}
                          </span>
                          <ChevronDown className="h-3 w-3 text-[#8b949e] shrink-0" />
                        </button>

                        {/* Stage Dropdown Menu */}
                        {openStageMenuTaskId === task.id && (
                          <div
                            className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border border-white/20 bg-[#161b22] p-1.5 shadow-2xl backdrop-blur-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8b949e] border-b border-white/10 mb-1">
                              Switch Subject Stage
                            </div>
                            <div className="max-h-52 overflow-y-auto space-y-1">
                              {subjectStages.map((stName, stIdx) => {
                                const stState = chapterObj?.stageStates?.[stIdx] ?? 0;
                                const isCurrent = task.stageName === stName;
                                return (
                                  <button
                                    key={stName}
                                    type="button"
                                    onClick={() => handleSelectTaskStage(task.id, stName, stIdx)}
                                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                                      isCurrent
                                        ? 'bg-[#58a6ff]/20 text-[#58a6ff] font-bold'
                                        : 'text-[#f0f6fc] hover:bg-white/10'
                                    }`}
                                  >
                                    <span className="truncate">{stIdx + 1}. {stName}</span>
                                    <span className="shrink-0 text-[10px]">
                                      {stState === 2 ? (
                                        <span className="text-emerald-400 font-medium">✓ Done</span>
                                      ) : stState === 1 ? (
                                        <span className="text-amber-400 font-medium">⏳ In Prog</span>
                                      ) : (
                                        <span className="text-[#8b949e]">○ Pending</span>
                                      )}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

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
                      className={`text-xs font-medium text-[#f0f6fc] leading-snug line-clamp-2 break-words ${
                        isDone ? 'line-through text-[#8b949e]' : ''
                      }`}
                      title={task.title || task.taskTitle}
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

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="text-[10px] font-bold text-[#8b949e] uppercase">
                    Subject
                  </label>
                  <select
                    value={customSubject}
                    onChange={e => {
                      const newSub = e.target.value as SubjectName;
                      setCustomSubject(newSub);
                      const stages = profile.customStages[newSub] || DEFAULT_STAGES[newSub] || [];
                      if (stages.length > 0) {
                        setCustomStage(stages[0]);
                      }
                    }}
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
                    Subject Stage
                  </label>
                  <select
                    value={customStage}
                    onChange={e => {
                      const newStage = e.target.value;
                      setCustomStage(newStage);
                      if (customChapter.trim()) {
                        setCustomTitle(`${newStage} — ${customChapter.trim()}`);
                      }
                    }}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-[#0d1117] p-2 text-xs text-[#f0f6fc]"
                  >
                    {customSubStages.map((st, idx) => (
                      <option key={st} value={st}>
                        Stage {idx + 1}: {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#8b949e] uppercase">
                    Duration (Minutes)
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
                  Chapter / Topic
                </label>
                {customSubChapters.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    <select
                      value={customChapter}
                      onChange={e => {
                        const chName = e.target.value;
                        setCustomChapter(chName);
                        if (chName && customStage) {
                          setCustomTitle(`${customStage} — ${chName}`);
                        }
                      }}
                      className="w-full rounded-xl border border-white/10 bg-[#0d1117] p-2 text-xs text-[#f0f6fc]"
                    >
                      <option value="">Select from {customSubject} chapters or type below...</option>
                      {customSubChapters.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or enter custom topic / exercise..."
                      value={customChapter}
                      onChange={e => {
                        setCustomChapter(e.target.value);
                        if (e.target.value && customStage) {
                          setCustomTitle(`${customStage} — ${e.target.value}`);
                        }
                      }}
                      className="w-full rounded-xl border border-white/10 bg-[#0d1117] p-2 text-xs text-[#f0f6fc]"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Quadratic Equations"
                    value={customChapter}
                    onChange={e => {
                      setCustomChapter(e.target.value);
                      if (e.target.value && customStage) {
                        setCustomTitle(`${customStage} — ${e.target.value}`);
                      }
                    }}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-[#0d1117] p-2 text-xs text-[#f0f6fc]"
                  />
                )}
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
                disabled={isGenerating}
                onClick={() => handleRegenerate()}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161b22] px-4 py-2.5 text-xs font-bold text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-60 transition-all"
                title="Regenerate plan with multi-subject balance & stage focus"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin text-[#58a6ff]' : ''}`} />
                <span>{isGenerating ? 'Regenerating...' : 'Regenerate'}</span>
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
