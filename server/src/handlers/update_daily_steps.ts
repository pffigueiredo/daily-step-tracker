import { db } from '../db';
import { dailyStepsTable } from '../db/schema';
import { type UpdateDailyStepsInput, type DailySteps } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDailySteps = async (input: UpdateDailyStepsInput): Promise<DailySteps> => {
  try {
    // Update the steps count and set updated_at to current timestamp
    const result = await db.update(dailyStepsTable)
      .set({
        steps: input.steps,
        updated_at: new Date() // Update the timestamp
      })
      .where(eq(dailyStepsTable.id, input.id))
      .returning()
      .execute();

    // Check if the record was found and updated
    if (result.length === 0) {
      throw new Error(`Daily steps record with id ${input.id} not found`);
    }

    // Convert date string to Date object to match schema
    const updatedRecord = result[0];
    return {
      ...updatedRecord,
      date: new Date(updatedRecord.date) // Convert string date to Date object
    };
  } catch (error) {
    console.error('Daily steps update failed:', error);
    throw error;
  }
};