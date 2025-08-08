import { serial, text, pgTable, timestamp, integer, date } from 'drizzle-orm/pg-core';

export const dailyStepsTable = pgTable('daily_steps', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(), // User identifier
  date: date('date').notNull(), // Date when steps were recorded (YYYY-MM-DD)
  steps: integer('steps').notNull(), // Number of steps as integer
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type DailySteps = typeof dailyStepsTable.$inferSelect; // For SELECT operations
export type NewDailySteps = typeof dailyStepsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { dailySteps: dailyStepsTable };