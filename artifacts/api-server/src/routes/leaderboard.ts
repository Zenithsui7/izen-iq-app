import { Router, type IRouter } from "express";
import { db, usersTable, testResultsTable } from "@workspace/db";
import { eq, desc, max, count, sql, inArray } from "drizzle-orm";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { period = "alltime", limit = 50 } = parsed.data;

  // Get users ranked by best IQ score
  const dateFilter = period === "weekly"
    ? sql`AND ${testResultsTable.completedAt} > NOW() - INTERVAL '7 days'`
    : sql``;

  const results = await db
    .select({
      userId: testResultsTable.userId,
      iqScore: max(testResultsTable.iqScore),
      totalTests: count(testResultsTable.id),
    })
    .from(testResultsTable)
    .groupBy(testResultsTable.userId)
    .orderBy(desc(max(testResultsTable.iqScore)))
    .limit(limit);

  const userIds = results
    .map((r) => r.userId)
    .filter((id): id is number => id !== null);

  const users = userIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds))
    : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  const leaderboard = results
    .filter((r) => r.userId !== null && r.iqScore !== null)
    .map((r, index) => {
      const user = userMap.get(r.userId!);
      const iqScore = r.iqScore!;

      let iqLevel = "average";
      if (iqScore >= 145) iqLevel = "genius";
      else if (iqScore >= 130) iqLevel = "gifted";
      else if (iqScore >= 115) iqLevel = "above_average";

      return {
        rank: index + 1,
        userId: r.userId!,
        name: user?.name ?? "Unknown",
        avatarUrl: user?.avatarUrl ?? null,
        iqScore,
        iqLevel,
        totalTests: Number(r.totalTests),
        streak: user?.streak ?? 0,
      };
    });

  res.json(leaderboard);
});

export default router;
