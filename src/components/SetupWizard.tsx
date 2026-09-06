import React, { useState } from 'react';
import { ClassLevel, SubjectName, UserProfile } from '../types';
import { SUBJECTS, SYLLABUS_DATA, DEFAULT_STAGES, getDefaultDatesheet } from '../data/cbseData';
import { Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface SetupWizardProps {
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('Umang');
  const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
  const [datesheet, setDatesheet] = useState<Record<SubjectName, string>>(() => getDefaultDatesheet());
  const [selectedChapters, setSelectedChapters] = useState<Record<SubjectName, string[]>>(() => {
    const map = {} as Record<SubjectName, string[]>;
    SUBJECTS.forEach(sub => {
      map[sub] = [...(SYLLABUS_DATA['Class 10'][sub] || [])];
    });
    return map;
  });

  const handleClassChange = (newLevel: ClassLevel) => {
    setClassLevel(newLevel);
    const map = {} as Record<SubjectName, string[]>;
    SUBJECTS.forEach(sub => {
      map[sub] = [...(SYLLABUS_DATA[newLevel][sub] || [])];
    });
    setSelectedChapters(map);
  };

  const handleToggleChapter = (sub: SubjectName, chName: string) => {
    const list = selectedChapters[sub] || [];
    if (list.includes(chName)) {
      setSelectedChapters(prev => ({
        ...prev,
        [sub]: prev[sub].filter(c => c !== chName)
      }));
    } else {
      setSelectedChapters(prev => ({
        ...prev,
        [sub]: [...(prev[sub] || []), chName]
      }));
    }
  };

  const handleFinish = () => {
    const id = 'prof_' + Date.now();
    const customStages = JSON.parse(JSON.stringify(DEFAULT_STAGES));
    const subjectsData: Record<string, any> = {};

    SUBJECTS.forEach(sub => {
      const chaps = selectedChapters[sub] || [];
      const stages = customStages[sub] || DEFAULT_STAGES[sub];
      subjectsData[sub] = {
        examDate: datesheet[sub] || new Date().toISOString().split('T')[0],
        weeklyTargetHours: 4,
        chapters: chaps.map(chName => ({
          id: 'ch_' + Math.random().toString(36).substring(2, 9),
          name: chName,
          stageStates: stages.map(() => 0)
        }))
      };
    });

    const newProf: UserProfile = {
      id,
      name: name.trim() || 'Student',
      classLevel,
      customStages,
      subjects: subjectsData,
      sessions: [],
      habits: [],
      sleepLogs: {},
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      targetExamName: `CBSE ${classLevel} Board Exam`
    };

    onComplete(newProf);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="bento-card w-full max-w-lg p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#58a6ff] font-extrabold text-[#0b0f19] text-xl shadow-lg shadow-[#58a6ff]/25">
            S
          </div>
          <h2 className="mt-3 text-2xl font-black text-[#f0f6fc]">
            Welcome to UMANG Bhaiya
          </h2>
          <p className="text-xs text-[#8b949e]">
            Set up your CBSE study tracker in 3 quick steps.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === s
                    ? 'bg-[#58a6ff] text-[#0b0f19] ring-4 ring-[#58a6ff]/20'
                    : step > s
                    ? 'bg-[#3fb950] text-[#0b0f19]'
                    : 'bg-white/10 text-[#8b949e]'
                }`}
              >
                {step > s ? <Check className="h-3.5 w-3.5" /> : s}
              </span>
              {s < 3 && <div className="h-0.5 w-8 bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#8b949e]">Student Name</label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-3 py-2.5 text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8b949e]">Select Grade</label>
              <div className="mt-1 flex gap-2">
                {(['Class 9', 'Class 10'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleClassChange(lvl)}
                    className={`flex-1 rounded-xl border py-3 text-xs font-bold transition-all ${
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

            <button
              onClick={() => setStep(2)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#58a6ff] py-3 text-xs font-bold text-[#0b0f19] hover:bg-sky-400"
            >
              <span>Next: Exam Datesheet</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
                Exam Datesheet (Calculates Study Pace)
              </h3>
              <p className="text-[11px] text-[#8b949e]/70">
                You can adjust these dates anytime in settings.
              </p>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {SUBJECTS.map(sub => (
                <div key={sub} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0f19] p-2 text-xs">
                  <span className="font-semibold text-[#f0f6fc]">{sub}</span>
                  <input
                    type="date"
                    value={datesheet[sub] || ''}
                    onChange={e => setDatesheet(prev => ({ ...prev, [sub]: e.target.value }))}
                    className="rounded-lg border border-white/10 bg-[#161b22] px-2 py-1 text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-xs font-bold text-[#8b949e] hover:bg-white/[0.05]"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-xl bg-[#58a6ff] py-2.5 text-xs font-bold text-[#0b0f19] hover:bg-sky-400"
              >
                Next: Syllabus Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
                CBSE Syllabus Review
              </h3>
              <p className="text-[11px] text-[#8b949e]/70">
                All CBSE chapters are included by default. Uncheck any omitted chapters.
              </p>
            </div>

            <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
              {SUBJECTS.map(sub => {
                const chapters = SYLLABUS_DATA[classLevel][sub] || [];
                const selected = selectedChapters[sub] || [];

                return (
                  <div key={sub} className="rounded-xl border border-white/10 bg-[#0b0f19] p-3">
                    <span className="text-xs font-bold text-[#58a6ff]">{sub} ({chapters.length} chapters)</span>
                    <div className="mt-2 space-y-1">
                      {chapters.map(ch => (
                        <label key={ch} className="flex items-center gap-2 text-xs text-[#8b949e] hover:text-[#f0f6fc] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected.includes(ch)}
                            onChange={() => handleToggleChapter(sub, ch)}
                            className="rounded border-white/20 bg-[#161b22] accent-[#58a6ff]"
                          />
                          <span className="truncate">{ch}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-xs font-bold text-[#8b949e] hover:bg-white/[0.05]"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 rounded-xl bg-[#58a6ff] py-2.5 text-xs font-bold text-[#0b0f19] hover:bg-sky-400"
              >
                Finish & Start Tracking 🚀
              </button>
            </div>
          </div>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-3 block w-full text-center text-xs text-[#8b949e] hover:text-[#f0f6fc]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
