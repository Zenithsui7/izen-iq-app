import { Router, type IRouter } from "express";
import { db, questionsTable, testSessionsTable, testResultsTable, testAnswersTable, usersTable } from "@workspace/db";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { StartTestBody, SubmitTestBody, ListTestsQueryParams } from "@workspace/api-zod";
import { calculateIQScore, getIQLevel, calculateSpeedScore, analyzeStrengthsWeaknesses } from "../lib/iq-calculator";

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

// GET /tests/daily — must be before /tests/:testId
router.get("/tests/daily", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  res.json({
    date: today,
    category: "mixed",
    difficulty: "medium",
    questionCount: 15,
    participantCount: Math.floor(Math.random() * 500) + 100,
    completed: false,
    userScore: null,
  });
});

router.post("/tests", async (req, res): Promise<void> => {
  const parsed = StartTestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category = "mixed", difficulty = "adaptive", questionCount = 20, userId } = parsed.data;

  // Fetch random questions based on category/difficulty
  const conditions: ReturnType<typeof eq>[] = [];
  if (category !== "mixed") {
    conditions.push(eq(questionsTable.category, category));
  }

  let difficultyFilter = difficulty;
  if (difficulty === "adaptive") {
    // Start with medium
    difficultyFilter = "medium";
  }

  if (difficultyFilter !== "adaptive") {
    conditions.push(eq(questionsTable.difficulty, difficultyFilter));
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`RANDOM()`)
    .limit(questionCount);

  if (questions.length === 0) {
    // Fallback: get any questions
    const fallback = await db
      .select()
      .from(questionsTable)
      .orderBy(sql`RANDOM()`)
      .limit(questionCount);

    if (fallback.length === 0) {
      res.status(404).json({ error: "No questions available" });
      return;
    }
    questions.push(...fallback);
  }

  const [session] = await db
    .insert(testSessionsTable)
    .values({
      userId: userId ?? null,
      category,
      difficulty,
      questionIds: questions.map((q) => q.id),
    })
    .returning();

  res.status(201).json({
    id: session.id,
    questions: questions.map((q) => ({
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      text: q.text,
      imageUrl: q.imageUrl ?? null,
      options: q.options,
      timeLimit: q.timeLimit,
    })),
    category: session.category,
    difficulty: session.difficulty,
    startedAt: session.startedAt.toISOString(),
  });
});

router.get("/tests", async (req, res): Promise<void> => {
  const parsed = ListTestsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, limit = 10 } = parsed.data;

  let results;
  if (userId) {
    results = await db
      .select()
      .from(testResultsTable)
      .where(eq(testResultsTable.userId, userId))
      .orderBy(desc(testResultsTable.completedAt))
      .limit(limit);
  } else {
    results = await db
      .select()
      .from(testResultsTable)
      .orderBy(desc(testResultsTable.completedAt))
      .limit(limit);
  }

  res.json(results.map(formatTestResult));
});

router.post("/tests/:testId/submit", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.testId) ? req.params.testId[0] : req.params.testId;
  const testId = parseInt(rawId, 10);

  if (isNaN(testId)) {
    res.status(400).json({ error: "Invalid test ID" });
    return;
  }

  const parsed = SubmitTestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { answers, timeTaken } = parsed.data;

  const [session] = await db
    .select()
    .from(testSessionsTable)
    .where(eq(testSessionsTable.id, testId));

  if (!session) {
    res.status(404).json({ error: "Test session not found" });
    return;
  }

  // Get questions for this session
  const questions = await db
    .select()
    .from(questionsTable)
    .where(inArray(questionsTable.id, session.questionIds));

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Evaluate answers
  let correctAnswers = 0;
  const answerDetails: Array<{ category: string; isCorrect: boolean }> = [];

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    const isCorrect = answer.selectedOption === question.correctOption;
    if (isCorrect) correctAnswers++;

    answerDetails.push({ category: question.category, isCorrect });

    await db.insert(testAnswersTable).values({
      sessionId: testId,
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      isCorrect: isCorrect ? 1 : 0,
      timeTaken: answer.timeTaken,
    });
  }

  const totalQuestions = answers.length;
  const accuracy = correctAnswers / Math.max(totalQuestions, 1);
  const iqScore = calculateIQScore(correctAnswers, totalQuestions, timeTaken, session.difficulty);
  const iqLevel = getIQLevel(iqScore);
  const speedScore = calculateSpeedScore(timeTaken, totalQuestions);
  const { strengths, weaknesses } = analyzeStrengthsWeaknesses(answerDetails, []);

  const [result] = await db
    .insert(testResultsTable)
    .values({
      sessionId: testId,
      userId: session.userId,
      iqScore,
      iqLevel,
      accuracy,
      speedScore,
      correctAnswers,
      totalQuestions,
      timeTaken,
      category: session.category,
      difficulty: session.difficulty,
      strengths,
      weaknesses,
    })
    .returning();

  // Update session completed
  await db
    .update(testSessionsTable)
    .set({ completedAt: new Date() })
    .where(eq(testSessionsTable.id, testId));

  // Update user streak if logged in
  if (session.userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
    if (user) {
      const lastTest = user.lastTestDate;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = user.streak;
      if (!lastTest || lastTest < yesterday) {
        newStreak = 1;
      } else if (lastTest >= yesterday && lastTest < today) {
        newStreak = user.streak + 1;
      }

      await db
        .update(usersTable)
        .set({ streak: newStreak, lastTestDate: new Date() })
        .where(eq(usersTable.id, session.userId));
    }
  }

  res.json(formatTestResult(result));
});

router.get("/tests/:testId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.testId) ? req.params.testId[0] : req.params.testId;
  const testId = parseInt(rawId, 10);

  if (isNaN(testId)) {
    res.status(400).json({ error: "Invalid test ID" });
    return;
  }

  const [result] = await db
    .select()
    .from(testResultsTable)
    .where(eq(testResultsTable.id, testId));

  if (!result) {
    res.status(404).json({ error: "Test result not found" });
    return;
  }

  res.json(formatTestResult(result));
});

export default router;
