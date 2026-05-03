import { Router, type IRouter } from "express";
import { db, usersTable, testResultsTable } from "@workspace/db";
import { eq, desc, max, count, avg } from "drizzle-orm";
import { UpdateUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/:userId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(rawId, 10);

  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Get best IQ score
  const [bestResult] = await db
    .select({ bestIq: max(testResultsTable.iqScore) })
    .from(testResultsTable)
    .where(eq(testResultsTable.userId, userId));

  const [testCount] = await db
    .select({ totalTests: count() })
    .from(testResultsTable)
    .where(eq(testResultsTable.userId, userId));

  const bestIq = bestResult?.bestIq ?? null;

  let iqLevel: string | null = null;
  if (bestIq !== null) {
    if (bestIq >= 145) iqLevel = "genius";
    else if (bestIq >= 130) iqLevel = "gifted";
    else if (bestIq >= 115) iqLevel = "above_average";
    else iqLevel = "average";
  }

  res.json({
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    bestIq,
    totalTests: testCount?.totalTests ?? 0,
    streak: user.streak,
    rank: null,
    iqLevel,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/users/:userId/update", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(rawId, 10);

  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.age !== undefined) updates.age = parsed.data.age;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    age: user.age ?? null,
    avatarUrl: user.avatarUrl ?? null,
    isGuest: user.isGuest,
    streak: user.streak,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
