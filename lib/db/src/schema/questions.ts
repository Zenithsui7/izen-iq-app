import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // logical, pattern, math, verbal
  difficulty: text("difficulty").notNull(), // easy, medium, hard, expert
  text: text("text").notNull(),
  imageUrl: text("image_url"),
  options: text("options").array().notNull(),
  correctOption: integer("correct_option").notNull(), // 0-indexed
  timeLimit: integer("time_limit").notNull().default(30), // seconds
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
