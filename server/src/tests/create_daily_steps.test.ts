import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyStepsTable } from '../db/schema';
import { type CreateDailyStepsInput } from '../schema';
import { createDailySteps } from '../handlers/create_daily_steps';
import { eq, and } from 'drizzle-orm';

const testInput: CreateDailyStepsInput = {
  user_id: 'user123',
  date: '2024-01-15',
  steps: 8500
};

describe('createDailySteps', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new daily steps record', async () => {
    const result = await createDailySteps(testInput);

    // Verify returned data structure
    expect(result.user_id).toEqual('user123');
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.steps).toEqual(8500);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save daily steps record to database', async () => {
    const result = await createDailySteps(testInput);

    // Query database to verify record was saved
    const records = await db.select()
      .from(dailyStepsTable)
      .where(eq(dailyStepsTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    expect(records[0].user_id).toEqual('user123');
    expect(records[0].date).toEqual('2024-01-15');
    expect(records[0].steps).toEqual(8500);
    expect(records[0].created_at).toBeInstanceOf(Date);
    expect(records[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update existing record for same user and date', async () => {
    // Create initial record
    const firstResult = await createDailySteps(testInput);

    // Create second record with same user and date but different steps
    const updatedInput: CreateDailyStepsInput = {
      user_id: 'user123',
      date: '2024-01-15',
      steps: 12000
    };

    const secondResult = await createDailySteps(updatedInput);

    // Should have same ID (updated, not created new)
    expect(secondResult.id).toEqual(firstResult.id);
    expect(secondResult.steps).toEqual(12000);
    expect(secondResult.user_id).toEqual('user123');
    expect(secondResult.date).toEqual(new Date('2024-01-15'));

    // Verify only one record exists in database
    const allRecords = await db.select()
      .from(dailyStepsTable)
      .where(
        and(
          eq(dailyStepsTable.user_id, 'user123'),
          eq(dailyStepsTable.date, '2024-01-15')
        )
      )
      .execute();

    expect(allRecords).toHaveLength(1);
    expect(allRecords[0].steps).toEqual(12000);
    expect(allRecords[0].updated_at > allRecords[0].created_at).toBe(true);
  });

  it('should create separate records for different dates', async () => {
    // Create first record
    await createDailySteps(testInput);

    // Create second record for different date
    const differentDateInput: CreateDailyStepsInput = {
      user_id: 'user123',
      date: '2024-01-16',
      steps: 9500
    };

    const secondResult = await createDailySteps(differentDateInput);

    // Verify both records exist
    const allRecords = await db.select()
      .from(dailyStepsTable)
      .where(eq(dailyStepsTable.user_id, 'user123'))
      .execute();

    expect(allRecords).toHaveLength(2);

    const dates = allRecords.map(record => record.date);
    expect(dates).toContain('2024-01-15');
    expect(dates).toContain('2024-01-16');
  });

  it('should create separate records for different users', async () => {
    // Create record for first user
    await createDailySteps(testInput);

    // Create record for second user on same date
    const differentUserInput: CreateDailyStepsInput = {
      user_id: 'user456',
      date: '2024-01-15',
      steps: 7500
    };

    const secondResult = await createDailySteps(differentUserInput);

    // Verify both records exist
    const allRecords = await db.select()
      .from(dailyStepsTable)
      .execute();

    expect(allRecords).toHaveLength(2);

    const userIds = allRecords.map(record => record.user_id);
    expect(userIds).toContain('user123');
    expect(userIds).toContain('user456');

    // Verify each user has their correct steps count
    const user123Record = allRecords.find(r => r.user_id === 'user123');
    const user456Record = allRecords.find(r => r.user_id === 'user456');

    expect(user123Record?.steps).toEqual(8500);
    expect(user456Record?.steps).toEqual(7500);
  });

  it('should handle zero steps correctly', async () => {
    const zeroStepsInput: CreateDailyStepsInput = {
      user_id: 'user123',
      date: '2024-01-15',
      steps: 0
    };

    const result = await createDailySteps(zeroStepsInput);

    expect(result.steps).toEqual(0);
    expect(result.user_id).toEqual('user123');
    expect(result.date).toEqual(new Date('2024-01-15'));
  });

  it('should handle large step counts correctly', async () => {
    const largeStepsInput: CreateDailyStepsInput = {
      user_id: 'user123',
      date: '2024-01-15',
      steps: 50000
    };

    const result = await createDailySteps(largeStepsInput);

    expect(result.steps).toEqual(50000);
    expect(result.user_id).toEqual('user123');
    expect(result.date).toEqual(new Date('2024-01-15'));
  });
});