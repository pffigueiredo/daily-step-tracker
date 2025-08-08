import { db } from '../db';
import { dailyStepsTable } from '../db/schema';
import { type GetStepsByDateInput, type DailySteps } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getStepsByDate(input: GetStepsByDateInput): Promise<DailySteps | null> {
  try {
    // Query for the specific user and date combination
    // The date column expects string in YYYY-MM-DD format
    const results = await db.select()
      .from(dailyStepsTable)
      .where(and(
        eq(dailyStepsTable.user_id, input.user_id),
        eq(dailyStepsTable.date, input.date)
      ))
      .limit(1)
      .execute();

    // Return the first result or null if no records found
    if (results.length > 0) {
      const result = results[0];
      return {
        ...result,
        date: new Date(result.date)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get steps by date:', error);
    throw error;
  }
}