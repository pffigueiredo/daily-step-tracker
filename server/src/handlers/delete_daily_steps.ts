import { db } from '../db';
import { dailyStepsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteDailySteps(id: number): Promise<boolean> {
  try {
    const result = await db.delete(dailyStepsTable)
      .where(eq(dailyStepsTable.id, id))
      .returning()
      .execute();

    // Return true if a record was deleted, false if no record found
    return result.length > 0;
  } catch (error) {
    console.error('Daily steps deletion failed:', error);
    throw error;
  }
}