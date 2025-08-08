import { z } from 'zod';

// Daily steps schema
export const dailyStepsSchema = z.object({
  id: z.number(),
  user_id: z.string(), // Assuming users are identified by string IDs
  date: z.coerce.date(), // Date when steps were recorded
  steps: z.number().int().nonnegative(), // Number of steps (non-negative integer)
  created_at: z.coerce.date(), // When the record was created
  updated_at: z.coerce.date() // When the record was last updated
});

export type DailySteps = z.infer<typeof dailyStepsSchema>;

// Input schema for recording/creating daily steps
export const createDailyStepsInputSchema = z.object({
  user_id: z.string().min(1), // Required user identifier
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"), // Date as string in YYYY-MM-DD format
  steps: z.number().int().nonnegative() // Validate that steps is a non-negative integer
});

export type CreateDailyStepsInput = z.infer<typeof createDailyStepsInputSchema>;

// Input schema for updating daily steps
export const updateDailyStepsInputSchema = z.object({
  id: z.number(),
  steps: z.number().int().nonnegative() // Only allow updating the steps count
});

export type UpdateDailyStepsInput = z.infer<typeof updateDailyStepsInputSchema>;

// Input schema for querying steps by user
export const getUserStepsInputSchema = z.object({
  user_id: z.string().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional()
});

export type GetUserStepsInput = z.infer<typeof getUserStepsInputSchema>;

// Input schema for getting steps for a specific date
export const getStepsByDateInputSchema = z.object({
  user_id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
});

export type GetStepsByDateInput = z.infer<typeof getStepsByDateInputSchema>;