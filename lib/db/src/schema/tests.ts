import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const testSessionsTable = pgTable("test_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  category: text("category").notNull().default("mixed"),
  difficulty: text("difficulty").notNull().default("adaptive"),
  questionIds: integer("question_ids").array().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const testResultsTable = pgTable("test_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  userId: integer("user_id"),
  iqScore: integer("iq_score").notNull(),
  iqLevel: text("iq_level").notNull(), // average, above_average, gifted, genius
  accuracy: real("accuracy").notNull(),
  speedScore: real("speed_score").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  timeTaken: integer("time_taken").notNull(), // seconds
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  strengths: text("strengths").array().notNull().default([]),
  weaknesses: text("weaknesses").array().notNull().default([]),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const testAnswersTable = pgTable("test_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionId: integer("question_id").notNull(),
  selectedOption: integer("selected_option").notNull(),
  isCorrect: integer("is_correct").notNull(), // 0 or 1
  timeTaken: integer("time_taken").notNull(),
});

export const insertTestSessionSchema = createInsertSchema(testSessionsTable).omit({ id: true, startedAt: true });
export type InsertTestSession = z.infer<typeof insertTestSessionSchema>;
export type TestSession = typeof testSessionsTable.$inferSelect;

export const insertTestResultSchema = createInsertSchema(testResultsTable).omit({ id: true, completedAt: true });
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResultsTable.$inferSelect;
