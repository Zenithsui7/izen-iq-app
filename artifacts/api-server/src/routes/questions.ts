import { Router, type IRouter } from "express";
import { db, questionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { ListQuestionsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/questions", async (req, res): Promise<void> => {
  const parsed = ListQuestionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, difficulty, limit = 20 } = parsed.data;

  let query = db.select().from(questionsTable);

  const conditions = [];
  if (category && category !== "mixed") {
    conditions.push(eq(questionsTable.category, category));
  }
  if (difficulty && difficulty !== "adaptive") {
    conditions.push(eq(questionsTable.difficulty, difficulty));
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined)
    .orderBy(sql`RANDOM()`)
    .limit(limit);

  const formatted = questions.map((q) => ({
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    text: q.text,
    imageUrl: q.imageUrl ?? null,
    options: q.options,
    timeLimit: q.timeLimit,
  }));

  res.json(formatted);
});

export default router;
