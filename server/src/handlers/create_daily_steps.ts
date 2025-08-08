import { db } from '../db';
import { dailyStepsTable } from '../db/schema';
import { type CreateDailyStepsInput, type DailySteps } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createDailySteps = async (input: CreateDailyStepsInput): Promise<DailySteps> => {
  try {
    // Check if a record already exists for this user and date
    const existingRecord = await db.select()
      .from(dailyStepsTable)
      .where(
        and(
          eq(dailyStepsTable.user_id, input.user_id),
          eq(dailyStepsTable.date, input.date)
        )
      )
      .execute();

    if (existingRecord.length > 0) {
      // Update existing record
      const result = await db.update(dailyStepsTable)
        .set({
          steps: input.steps,
          updated_at: new Date()
        })
        .where(eq(dailyStepsTable.id, existingRecord[0].id))
        .returning()
        .execute();

      const record = result[0];
      return {
        ...record,
        date: new Date(record.date) // Convert string date to Date object
      };
    } else {
      // Create new record
      const result = await db.insert(dailyStepsTable)
        .values({
          user_id: input.user_id,
          date: input.date,
          steps: input.steps
        })
        .returning()
        .execute();

      const record = result[0];
      return {
        ...record,
        date: new Date(record.date) // Convert string date to Date object
      };
    }
  } catch (error) {
    console.error('Daily steps creation/update failed:', error);
    throw error;
  }
};