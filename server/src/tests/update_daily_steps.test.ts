import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyStepsTable } from '../db/schema';
import { type UpdateDailyStepsInput } from '../schema';
import { updateDailySteps } from '../handlers/update_daily_steps';
import { eq } from 'drizzle-orm';

// Test input for updating daily steps
const testUpdateInput: UpdateDailyStepsInput = {
  id: 1, // Will be set dynamically in tests
  steps: 8500
};

describe('updateDailySteps', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update steps for an existing record', async () => {
    // First, create a daily steps record
    const createResult = await db.insert(dailyStepsTable)
      .values({
        user_id: 'user123',
        date: '2023-12-01',
        steps: 5000,
        created_at: new Date('2023-12-01T10:00:00Z'),
        updated_at: new Date('2023-12-01T10:00:00Z')
      })
      .returning()
      .execute();

    const createdRecord = createResult[0];
    const originalUpdatedAt = createdRecord.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the steps
    const updateInput = { id: createdRecord.id, steps: 8500 };
    const result = await updateDailySteps(updateInput);

    // Verify the updated record
    expect(result.id).toEqual(createdRecord.id);
    expect(result.user_id).toEqual('user123');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2023-12-01');
    expect(result.steps).toEqual(8500);
    expect(result.created_at).toEqual(originalUpdatedAt); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should save updated steps to database', async () => {
    // Create initial record
    const createResult = await db.insert(dailyStepsTable)
      .values({
        user_id: 'user456',
        date: '2023-12-02',
        steps: 3000,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const createdRecord = createResult[0];

    // Update the record
    const updateInput = { id: createdRecord.id, steps: 12000 };
    await updateDailySteps(updateInput);

    // Query database to verify changes were persisted
    const updatedRecords = await db.select()
      .from(dailyStepsTable)
      .where(eq(dailyStepsTable.id, createdRecord.id))
      .execute();

    expect(updatedRecords).toHaveLength(1);
    const updatedRecord = updatedRecords[0];
    expect(updatedRecord.steps).toEqual(12000);
    expect(updatedRecord.user_id).toEqual('user456');
    expect(updatedRecord.date).toEqual('2023-12-02'); // Database stores as string
  });

  it('should throw error when record does not exist', async () => {
    const nonExistentUpdateInput = { id: 9999, steps: 5000 };

    // Should throw error for non-existent record
    await expect(updateDailySteps(nonExistentUpdateInput))
      .rejects.toThrow(/Daily steps record with id 9999 not found/i);
  });

  it('should handle zero steps correctly', async () => {
    // Create initial record
    const createResult = await db.insert(dailyStepsTable)
      .values({
        user_id: 'user789',
        date: '2023-12-03',
        steps: 10000,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const createdRecord = createResult[0];

    // Update to zero steps (valid use case)
    const updateInput = { id: createdRecord.id, steps: 0 };
    const result = await updateDailySteps(updateInput);

    expect(result.steps).toEqual(0);

    // Verify in database
    const verifyRecords = await db.select()
      .from(dailyStepsTable)
      .where(eq(dailyStepsTable.id, createdRecord.id))
      .execute();

    expect(verifyRecords[0].steps).toEqual(0);
  });

  it('should handle large step counts correctly', async () => {
    // Create initial record
    const createResult = await db.insert(dailyStepsTable)
      .values({
        user_id: 'user999',
        date: '2023-12-04',
        steps: 5000,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const createdRecord = createResult[0];

    // Update with very large step count
    const updateInput = { id: createdRecord.id, steps: 100000 };
    const result = await updateDailySteps(updateInput);

    expect(result.steps).toEqual(100000);
    expect(result.id).toEqual(createdRecord.id);
    expect(result.user_id).toEqual('user999');
  });
});