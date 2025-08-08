import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyStepsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteDailySteps } from '../handlers/delete_daily_steps';

describe('deleteDailySteps', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing daily steps record', async () => {
    // Create a test record first
    const insertResult = await db.insert(dailyStepsTable)
      .values({
        user_id: 'user123',
        date: '2024-01-15',
        steps: 10000
      })
      .returning()
      .execute();

    const recordId = insertResult[0].id;

    // Delete the record
    const result = await deleteDailySteps(recordId);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the record was actually deleted from database
    const remainingRecords = await db.select()
      .from(dailyStepsTable)
      .where(eq(dailyStepsTable.id, recordId))
      .execute();

    expect(remainingRecords).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent record', async () => {
    // Try to delete a record that doesn't exist
    const result = await deleteDailySteps(999999);

    // Should return false indicating no record was deleted
    expect(result).toBe(false);
  });

  it('should not affect other records when deleting specific record', async () => {
    // Create multiple test records
    const insertResults = await db.insert(dailyStepsTable)
      .values([
        {
          user_id: 'user123',
          date: '2024-01-15',
          steps: 10000
        },
        {
          user_id: 'user123',
          date: '2024-01-16',
          steps: 12000
        },
        {
          user_id: 'user456',
          date: '2024-01-15',
          steps: 8000
        }
      ])
      .returning()
      .execute();

    const recordToDelete = insertResults[1].id;

    // Delete the middle record
    const result = await deleteDailySteps(recordToDelete);

    expect(result).toBe(true);

    // Verify other records still exist
    const remainingRecords = await db.select()
      .from(dailyStepsTable)
      .execute();

    expect(remainingRecords).toHaveLength(2);
    expect(remainingRecords.map(r => r.id)).not.toContain(recordToDelete);
    expect(remainingRecords.map(r => r.id)).toContain(insertResults[0].id);
    expect(remainingRecords.map(r => r.id)).toContain(insertResults[2].id);
  });

  it('should handle deletion of record with zero steps', async () => {
    // Create a record with zero steps
    const insertResult = await db.insert(dailyStepsTable)
      .values({
        user_id: 'user123',
        date: '2024-01-15',
        steps: 0
      })
      .returning()
      .execute();

    const recordId = insertResult[0].id;

    // Delete the record
    const result = await deleteDailySteps(recordId);

    expect(result).toBe(true);

    // Verify deletion
    const remainingRecords = await db.select()
      .from(dailyStepsTable)
      .where(eq(dailyStepsTable.id, recordId))
      .execute();

    expect(remainingRecords).toHaveLength(0);
  });
});