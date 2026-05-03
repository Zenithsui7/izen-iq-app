import { Router, type IRouter } from "express";
import { db, usersTable, testResultsTable } from "@workspace/db";
import { eq, desc, max, min, count, avg, sql } from "drizzle-orm";
import { GetDashboardStatsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function formatTestResult(result: typeof testResultsTable.$inferSelect) {
  return {
    id: result.id,
    userId: result.userId ?? 0,
    iqScore: result.iqScore,
    iqLevel: result.iqLevel as "average" | "above_average" | "gifted" | "genius",
    accuracy: result.accuracy,
    speedScore: result.speedScore,
    correctAnswers: result.correctAnswers,
    totalQuestions: result.totalQuestions,
    timeTaken: result.timeTaken,
    category: result.category,
    difficulty: result.difficulty,
    strengths: result.strengths ?? [],
    weaknesses: result.weaknesses ?? [],
    completedAt: result.completedAt.toISOString(),
  };
}

router.get("/stats/dashboard", async (req, res): Promise<void> => {
  const parsed = GetDashboardStatsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId } = parsed.data;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const userResults = await db
    .select()
    .from(testResultsTable)
    .where(eq(testResultsTable.userId, userId))
    .orderBy(desc(testResultsTable.completedAt));

  const bestIq = userResults.length > 0 ? Math.max(...userResults.map((r) => r.iqScore)) : 0;
  const averageIq = userResults.length > 0
    ? Math.round(userResults.reduce((sum, r) => sum + r.iqScore, 0) / userResults.length)
    : 0;

  let iqLevel: string | null = null;
  if (bestIq > 0) {
    if (bestIq >= 145) iqLevel = "genius";
    else if (bestIq >= 130) iqLevel = "gifted";
    else if (bestIq >= 115) iqLevel = "above_average";
    else iqLevel = "average";
  }

  // IQ history (last 10 tests)
  const iqHistory = userResults.slice(0, 10).reverse().map((r) => ({
    date: r.completedAt.toISOString().split("T")[0],
    iqScore: r.iqScore,
    category: r.category,
  }));

  // Category breakdown
  const categoryMap: Record<string, { scores: number[]; correct: number; total: number }> = {};
  for (const result of userResults) {
    if (!categoryMap[result.category]) {
      categoryMap[result.category] = { scores: [], correct: 0, total: 0 };
    }
    categoryMap[result.category].scores.push(result.iqScore);
    categoryMap[result.category].correct += result.correctAnswers;
    categoryMap[result.category].total += result.totalQuestions;
  }

  const categoryBreakdown = Object.entries(categoryMap).map(([category, stats]) => ({
    category,
    averageScore: Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length),
    testsCount: stats.scores.length,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) / 100 : 0,
  }));

  // Global rank
  const allBestScores = await db
    .select({ userId: testResultsTable.userId, best: max(testResultsTable.iqScore) })
    .from(testResultsTable)
    .groupBy(testResultsTable.userId)
    .orderBy(desc(max(testResultsTable.iqScore)));

  const rankIndex = allBestScores.findIndex((r) => r.userId === userId);
  const globalRank = rankIndex >= 0 ? rankIndex + 1 : null;

  res.json({
    userId,
    bestIq,
    averageIq,
    totalTests: userResults.length,
    currentStreak: user.streak,
    globalRank,
    iqLevel,
    recentTests: userResults.slice(0, 5).map(formatTestResult),
    iqHistory,
    categoryBreakdown,
  });
});

router.get("/stats/global", async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [testCount] = await db.select({ count: count() }).from(testResultsTable);
  const [avgResult] = await db.select({ avg: avg(testResultsTable.iqScore) }).from(testResultsTable);
  const [topResult] = await db
    .select({ top: max(testResultsTable.iqScore) })
    .from(testResultsTable);

  res.json({
    totalUsers: Number(userCount?.count ?? 0),
    totalTests: Number(testCount?.count ?? 0),
    averageIq: Math.round(Number(avgResult?.avg ?? 100)),
    topIq: Number(topResult?.top ?? 0),
  });
});

export default router;
