import React, { useState } from 'react';
import { UserProfile, SubjectName, ClassLevel } from '../types';
import { SUBJECTS, DEFAULT_STAGES, SYLLABUS_DATA } from '../data/cbseData';
import { Save, RotateCcw, Plus, Scissors, ArrowUp, ArrowDown, Download, Upload, AlertTriangle, Check, Trash2 } from 'lucide-react';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetAllData: () => void;
  onRestoreDefaultChapters: (subject: SubjectName) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onExportJSON,
  onImportJSON,
  onResetAllData,
  onRestoreDefaultChapters
}) => {
  const [studentName, setStudentName] = useState<string>(profile.name);
  const [classLevel, setClassLevel] = useState<ClassLevel>(profile.classLevel);
  const [datesheet, setDatesheet] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    SUBJECTS.forEach(sub => {
      map[sub] = profile.subjects[sub]?.examDate || '';
    });
    return map;
  });

  // Manage Chapters state
  const [activeChapterSubject, setActiveChapterSubject] = useState<SubjectName>('Mathematics');
  const [activeStageSubject, setActiveStageSubject] = useState<SubjectName>('Mathematics');

  const [customStages, setCustomStages] = useState<Record<string, string[]>>(() => {
    return JSON.parse(JSON.stringify(profile.customStages || DEFAULT_STAGES));
  });

  // Save student info & datesheet
  const handleSaveGeneral = () => {
    const updated = { ...profile };
    updated.name = studentName.trim() || 'Student';
    updated.classLevel = classLevel;
    SUBJECTS.forEach(sub => {
      if (!updated.subjects[sub]) {
        updated.subjects[sub] = { examDate: datesheet[sub] || '', chapters: [] };
      } else {
        updated.subjects[sub].examDate = datesheet[sub] || '';
      }
    });
    onUpdateProfile(updated);
  };

  // Move chapter up/down
  const handleMoveChapter = (fromIdx: number, toIdx: number) => {
    const updated = { ...profile };
    const chaps = updated.subjects[activeChapterSubject]?.chapters;
    if (!chaps || toIdx < 0 || toIdx >= chaps.length) return;
    const item = chaps.splice(fromIdx, 1)[0];
    chaps.splice(toIdx, 0, item);
    onUpdateProfile(updated);
  };

  // Delete/cut chapter in settings
  const handleDeleteChapter = (chIdx: number) => {
    const updated = { ...profile };
    const chaps = updated.subjects[activeChapterSubject]?.chapters;
    if (!chaps) return;
    chaps.splice(chIdx, 1);
    onUpdateProfile(updated);
  };

  // Rename chapter on change
  const handleChapterNameChange = (chIdx: number, newName: string) => {
    const updated = { ...profile };
    const ch = updated.subjects[activeChapterSubject]?.chapters[chIdx];
    if (ch) {
      ch.name = newName;
      onUpdateProfile(updated);
    }
  };

  // Add blank chapter
  const handleAddBlankChapter = () => {
    const updated = { ...profile };
    if (!updated.subjects[activeChapterSubject]) {
      updated.subjects[activeChapterSubject] = { examDate: '', chapters: [] };
    }
    const stages = updated.customStages[activeChapterSubject] || DEFAULT_STAGES[activeChapterSubject];
    const newIdx = updated.subjects[activeChapterSubject].chapters.length + 1;
    updated.subjects[activeChapterSubject].chapters.push({
      id: 'ch_' + Math.random().toString(36).substring(2, 9),
      name: `New Chapter ${newIdx}`,
      stageStates: stages.map(() => 0)
    });
    onUpdateProfile(updated);
  };

  // Stage editor functions
  const handleAddStage = () => {
    const updated = { ...customStages };
    if (!updated[activeStageSubject]) {
      updated[activeStageSubject] = [...(DEFAULT_STAGES[activeStageSubject] || [])];
    }
    updated[activeStageSubject].push('New Preparation Stage');
    setCustomStages(updated);
  };

  const handleDeleteStage = (sIdx: number) => {
    const current = customStages[activeStageSubject] || [];
    if (current.length <= 1) return;
    const updated = { ...customStages };
    updated[activeStageSubject].splice(sIdx, 1);
    setCustomStages(updated);
  };

  const handleStageTitleChange = (sIdx: number, title: string) => {
    const updated = { ...customStages };
    updated[activeStageSubject][sIdx] = title;
    setCustomStages(updated);
  };

  const handleSaveStages = () => {
    const updated = { ...profile, customStages };
    onUpdateProfile(updated);
  };

  const currentChapters = profile.subjects[activeChapterSubject]?.chapters || [];
  const currentStages = customStages[activeStageSubject] || DEFAULT_STAGES[activeStageSubject];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="card-title m-0 mb-1">
          <span>⚙️</span>
          <span>Configuration & Profile</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-[#f0f6fc] sm:text-3xl">
          Settings & Profile Management
        </h2>
        <p className="text-xs text-[#8b949e] sm:text-sm">
          Edit datesheet, manage CBSE syllabus, customize preparation stages, and export data.
        </p>
      </div>

      {/* 1. Profile Info & Exam Datesheet */}
      <div className="bento-card p-5 sm:p-6">
        <div className="card-title m-0">
          <span>👤</span>
          <span>Student Profile & Exam Datesheet</span>
        </div>
        <p className="mt-1 text-xs text-[#8b949e]">
          Setting exact exam dates calculates required daily pace (stages/day).
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-[#8b949e]">Student Name</label>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-3 py-2 text-xs font-semibold text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#8b949e]">Class Level</label>
            <div className="mt-1 flex gap-2">
              {(['Class 9', 'Class 10'] as const).map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setClassLevel(lvl)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${
                    classLevel === lvl
                      ? 'border-[#58a6ff] bg-[#58a6ff] text-[#0b0f19]'
                      : 'border-white/10 bg-[#0b0f19] text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Datesheet Grid */}
        <div className="mt-6 border-t border-white/10 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
            Subject Exam Dates (CBSE Datesheet)
          </h4>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {SUBJECTS.map(sub => (
              <div key={sub} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <label className="text-xs font-bold text-[#f0f6fc]">{sub}</label>
                <input
                  type="date"
                  value={datesheet[sub] || ''}
                  onChange={e => setDatesheet(prev => ({ ...prev, [sub]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-2.5 py-1.5 text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveGeneral}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#58a6ff] px-6 py-2.5 text-xs font-bold text-[#0b0f19] hover:bg-sky-400"
          >
            <Save className="h-4 w-4" />
            Save Profile & Datesheet
          </button>
        </div>
      </div>

      {/* 2. Manage Chapters & Syllabus (Cut / Add / Reorder) */}
      <div className="bento-card p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="card-title m-0">
              <span>✂️</span>
              <span>Manage Chapters & Syllabus (Cut / Add / Reorder)</span>
            </div>
            <p className="mt-1 text-xs text-[#8b949e]">
              Cut omitted/deleted syllabus chapters, reorder, or add custom sub-topics.
            </p>
          </div>
          <span className="text-xs font-bold text-[#58a6ff]">
            {currentChapters.length} Chapters Active
          </span>
        </div>

        {/* Subject Pills */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {SUBJECTS.map(sub => {
            const isActive = sub === activeChapterSubject;
            return (
              <button
                key={sub}
                onClick={() => setActiveChapterSubject(sub)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'border-[#58a6ff] bg-[#58a6ff] text-[#0b0f19]'
                    : 'border-white/10 bg-[#0b0f19] text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]'
                }`}
              >
                {sub} ({profile.subjects[sub]?.chapters?.length || 0})
              </button>
            );
          })}
        </div>

        {/* Chapters Reorder List */}
        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
          {currentChapters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-[#8b949e]">
              No chapters in {activeChapterSubject}. Restore CBSE chapters below.
            </div>
          ) : (
            currentChapters.map((ch, idx) => (
              <div
                key={ch.id}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2.5"
              >
                <span className="w-7 text-center text-xs font-bold text-[#8b949e]">#{idx + 1}</span>
                <input
                  type="text"
                  value={ch.name}
                  onChange={e => handleChapterNameChange(idx, e.target.value)}
                  className="flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1 text-xs font-semibold text-[#f0f6fc] focus:border-[#58a6ff] focus:bg-[#0b0f19]"
                />

                {/* Move up / down */}
                <div className="flex items-center gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveChapter(idx, idx - 1)}
                    className="rounded-lg border border-white/10 bg-white/[0.02] p-1.5 text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={idx === currentChapters.length - 1}
                    onClick={() => handleMoveChapter(idx, idx + 1)}
                    className="rounded-lg border border-white/10 bg-white/[0.02] p-1.5 text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteChapter(idx)}
                    className="rounded-lg border border-[#f85149]/30 bg-[#f85149]/10 p-1.5 text-[#f85149] hover:bg-[#f85149]/20"
                    title="Cut Chapter"
                  >
                    <Scissors className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleAddBlankChapter}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-bold text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]"
          >
            <Plus className="h-4 w-4" />
            Add New Chapter
          </button>
          <button
            onClick={() => onRestoreDefaultChapters(activeChapterSubject)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-bold text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]"
          >
            <RotateCcw className="h-4 w-4" />
            Restore Standard CBSE Chapters
          </button>
        </div>
      </div>

      {/* 3. Customize Chapter Preparation Stages */}
      <div className="bento-card p-5 sm:p-6">
        <div className="card-title m-0">
          <span>🎚️</span>
          <span>Customize Preparation Stages (Variable per Subject)</span>
        </div>
        <p className="mt-1 text-xs text-[#8b949e]">
          Tailor preparation stages to match your school/coaching material (e.g., NCERT, Exemplar, HOTS, PYQ).
        </p>

        {/* Subject selector */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {SUBJECTS.map(sub => {
            const isActive = sub === activeStageSubject;
            return (
              <button
                key={sub}
                onClick={() => setActiveStageSubject(sub)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'border-[#58a6ff] bg-[#58a6ff] text-[#0b0f19]'
                    : 'border-white/10 bg-[#0b0f19] text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>

        {/* Stages list */}
        <div className="mt-4 space-y-2">
          {currentStages.map((stg, sIdx) => (
            <div
              key={sIdx}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2.5"
            >
              <span className="w-16 text-xs font-bold text-[#8b949e]">Stage {sIdx + 1}</span>
              <input
                type="text"
                value={stg}
                onChange={e => handleStageTitleChange(sIdx, e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-[#0b0f19] px-3 py-1.5 text-xs font-semibold text-[#f0f6fc] focus:border-[#58a6ff]"
              />
              <button
                disabled={currentStages.length <= 1}
                onClick={() => handleDeleteStage(sIdx)}
                className="rounded-lg border border-[#f85149]/30 bg-[#f85149]/10 p-2 text-[#f85149] hover:bg-[#f85149]/20 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleAddStage}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-bold text-[#8b949e] hover:border-white/20 hover:text-[#f0f6fc]"
          >
            <Plus className="h-4 w-4" />
            Add Stage
          </button>
          <button
            onClick={handleSaveStages}
            className="flex items-center gap-1.5 rounded-xl bg-[#58a6ff] px-5 py-2 text-xs font-bold text-[#0b0f19] hover:bg-sky-400"
          >
            <Save className="h-4 w-4" />
            Save Custom Stages
          </button>
        </div>
      </div>

      {/* 4. Backup & Reset */}
      <div className="bento-card p-5 sm:p-6">
        <div className="card-title m-0">
          <span>💾</span>
          <span>Profiles & Offline Backup</span>
        </div>
        <p className="mt-1 text-xs text-[#8b949e]">
          Save your complete study history, stages, sleep logs, and sessions to a JSON file.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={onExportJSON}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs font-bold text-[#8b949e] hover:border-white/20 hover:text-[#58a6ff]"
          >
            <Download className="h-4 w-4" />
            Export Backup JSON
          </button>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs font-bold text-[#8b949e] hover:border-white/20 hover:text-[#58a6ff]">
            <Upload className="h-4 w-4" />
            Import Backup JSON
            <input type="file" accept=".json" onChange={onImportJSON} className="hidden" />
          </label>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <button
            onClick={onResetAllData}
            className="flex items-center gap-2 rounded-xl border border-[#f85149]/30 bg-[#f85149]/10 px-4 py-2.5 text-xs font-bold text-[#f85149] hover:bg-[#f85149]/20"
          >
            <AlertTriangle className="h-4 w-4" />
            Reset All Application Data
          </button>
        </div>
      </div>
    </div>
  );
};
