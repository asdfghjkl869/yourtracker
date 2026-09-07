import { Chapter, ChapterDifficulty, SubjectName, UserProfile, ExamMode } from '../types';
import { getDaysRemaining } from './helpers';

export interface RankedChapterItem {
  subject: SubjectName;
  chapter: Chapter;
  priorityScore: number;
  difficulty: ChapterDifficulty;
  doneStages: number;
  totalStages: number;
  percentDone: number;
  mistakesCount: number;
  daysLeft: number;
  urgencyTag: string;
  reasons: string[];
}

export function getChapterMistakesCount(profile: UserProfile, subject: SubjectName, chapterName: string): number {
  if (!profile.mistakes || profile.mistakes.length === 0) return 0;
  return profile.mistakes.filter(
    m => m.subject === subject && m.chapterName.trim().toLowerCase() === chapterName.trim().toLowerCase() && !m.resolved
  ).length;
}

export function calculateChapterPriorityScore(
  chapter: Chapter,
  subject: SubjectName,
  profile: UserProfile
): { score: number; urgencyTag: string; reasons: string[] } {
  let score = 20; // Base score
  const reasons: string[] = [];

  // 1. Difficulty Tag (+30 for Hard, +16 for Medium, +5 for Easy)
  const diff = chapter.difficulty || 'Medium';
  if (diff === 'Hard') {
    score += 30;
    reasons.push('Hard Difficulty');
  } else if (diff === 'Medium') {
    score += 16;
  } else {
    score += 5;
  }

  // 2. Stage completion & revision count
  const stagesList = profile.customStages[subject] || [];
  const totalStages = stagesList.length || 4;
  const doneStages = (chapter.stageStates || []).filter(s => s === 2).length;
  const percent = totalStages > 0 ? (doneStages / totalStages) * 100 : 0;

  if (percent === 0) {
    score += 35;
    reasons.push('Never Revised (0% Complete)');
  } else if (percent < 50) {
    score += 22;
    reasons.push('Low Coverage (<50%)');
  } else if (percent < 100) {
    score += 10;
  } else {
    // 100% complete gets low priority unless mistakes are pending
    score -= 20;
  }

  // 3. Mistakes count (+14 points per mistake, up to 42)
  const mistakeCount = getChapterMistakesCount(profile, subject, chapter.name);
  if (mistakeCount > 0) {
    const mistakeBonus = Math.min(42, mistakeCount * 14);
    score += mistakeBonus;
    reasons.push(`${mistakeCount} Unresolved Mistake${mistakeCount > 1 ? 's' : ''}`);
  }

  // 4. Days to exam urgency
  const examDate = profile.subjects[subject]?.examDate || '';
  const daysLeft = getDaysRemaining(examDate);
  if (daysLeft >= 0) {
    if (daysLeft <= 7) {
      score += 40;
      reasons.push(`Exam in ${daysLeft} Day${daysLeft === 1 ? '' : 's'}!`);
    } else if (daysLeft <= 14) {
      score += 24;
      reasons.push(`Exam in ${daysLeft} Days`);
    } else if (daysLeft <= 30) {
      score += 12;
    }
  }

  // 5. Exam-Specific Mode modifiers
  const mode: ExamMode = profile.examMode || 'Final Boards';
  if (mode === 'Pre-boards') {
    if (diff === 'Hard' || mistakeCount > 0) {
      score += 15;
      reasons.push('Pre-boards Weak Focus');
    }
  } else if (mode === 'Final Boards') {
    if (percent === 0 || daysLeft <= 14) {
      score += 15;
      reasons.push('Final Boards Fast-Track');
    }
  }

  // Bound score between 5 and 99
  const finalScore = Math.min(99, Math.max(5, Math.round(score)));

  let urgencyTag = 'Normal';
  if (finalScore >= 80) urgencyTag = 'Critical Priority 🔥';
  else if (finalScore >= 60) urgencyTag = 'High Priority ⚡';
  else if (finalScore >= 40) urgencyTag = 'Medium Priority';
  else urgencyTag = 'Review / Maintenance';

  return { score: finalScore, urgencyTag, reasons };
}

export function getRankedChapters(profile: UserProfile): RankedChapterItem[] {
  const ranked: RankedChapterItem[] = [];

  for (const [subName, subData] of Object.entries(profile.subjects)) {
    const subject = subName as SubjectName;
    const stagesList = profile.customStages[subject] || [];
    const totalStages = stagesList.length || 4;
    const daysLeft = getDaysRemaining(subData.examDate);

    for (const chapter of subData.chapters || []) {
      const doneStages = (chapter.stageStates || []).filter(s => s === 2).length;
      const percentDone = totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0;
      const mistakesCount = getChapterMistakesCount(profile, subject, chapter.name);
      const diff: ChapterDifficulty = chapter.difficulty || 'Medium';

      const { score, urgencyTag, reasons } = calculateChapterPriorityScore(chapter, subject, profile);

      ranked.push({
        subject,
        chapter,
        priorityScore: score,
        difficulty: diff,
        doneStages,
        totalStages,
        percentDone,
        mistakesCount,
        daysLeft,
        urgencyTag,
        reasons
      });
    }
  }

  // Sort descending by priority score
  ranked.sort((a, b) => b.priorityScore - a.priorityScore);
  return ranked;
}
