export type IQLevel = "average" | "above_average" | "gifted" | "genius";

export function calculateIQScore(
  correctAnswers: number,
  totalQuestions: number,
  timeTaken: number,
  difficulty: string
): number {
  const accuracy = correctAnswers / totalQuestions;
  
  // Base IQ from accuracy (70-145 range)
  const baseIQ = 70 + accuracy * 75;

  // Difficulty multiplier
  const difficultyMultiplier: Record<string, number> = {
    easy: 0.85,
    medium: 0.95,
    hard: 1.05,
    expert: 1.15,
    adaptive: 1.0,
  };
  const diffMult = difficultyMultiplier[difficulty] ?? 1.0;

  // Speed bonus/penalty (expected ~25s per question)
  const expectedTime = totalQuestions * 25;
  const speedRatio = expectedTime / Math.max(timeTaken, 1);
  const speedBonus = Math.max(-10, Math.min(10, (speedRatio - 1) * 15));

  const rawIQ = baseIQ * diffMult + speedBonus;
  
  // Clamp to realistic range
  return Math.round(Math.max(70, Math.min(160, rawIQ)));
}

export function getIQLevel(iqScore: number): IQLevel {
  if (iqScore >= 145) return "genius";
  if (iqScore >= 130) return "gifted";
  if (iqScore >= 115) return "above_average";
  return "average";
}

export function calculateSpeedScore(timeTaken: number, totalQuestions: number): number {
  const avgTimePerQ = timeTaken / totalQuestions;
  // Perfect speed = 10s per question, max penalty at 60s
  const normalized = Math.max(0, Math.min(1, 1 - (avgTimePerQ - 10) / 50));
  return Math.round(normalized * 100) / 100;
}

export function analyzeStrengthsWeaknesses(
  answers: Array<{ category: string; isCorrect: boolean }>,
  categories: string[]
): { strengths: string[]; weaknesses: string[] } {
  const categoryStats: Record<string, { correct: number; total: number }> = {};

  for (const answer of answers) {
    if (!categoryStats[answer.category]) {
      categoryStats[answer.category] = { correct: 0, total: 0 };
    }
    categoryStats[answer.category].total++;
    if (answer.isCorrect) categoryStats[answer.category].correct++;
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const [cat, stats] of Object.entries(categoryStats)) {
    const rate = stats.correct / stats.total;
    if (rate >= 0.7) strengths.push(cat);
    else if (rate <= 0.4) weaknesses.push(cat);
  }

  return { strengths, weaknesses };
}
