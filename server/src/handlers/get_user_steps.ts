import { db } from '../db';
import { dailyStepsTable } from '../db/schema';
import { type GetUserStepsInput, type DailySteps } from '../schema';
import { eq, and, gte, lte, desc, type SQL } from 'drizzle-orm';

export async function getUserSteps(input: GetUserStepsInput): Promise<DailySteps[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(dailyStepsTable.user_id, input.user_id));

    // Add date range filters if provided
    if (input.start_date) {
      conditions.push(gte(dailyStepsTable.date, input.start_date));
    }

    if (input.end_date) {
      conditions.push(lte(dailyStepsTable.date, input.end_date));
    }

    // Build complete query with all conditions
    const results = await db.select()
      .from(dailyStepsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(dailyStepsTable.date))
      .execute();

    // Convert date strings to Date objects and return
    return results.map(result => ({
      ...result,
      date: new Date(result.date),
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Get user steps failed:', error);
    throw error;
  }
}