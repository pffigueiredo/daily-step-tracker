import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyStepsTable } from '../db/schema';
import { type GetStepsByDateInput } from '../schema';
import { getStepsByDate } from '../handlers/get_steps_by_date';

// Test inputs
const testInput: GetStepsByDateInput = {
  user_id: 'user123',
  date: '2024-01-15'
};

const differentUserInput: GetStepsByDateInput = {
  user_id: 'user456',
  date: '2024-01-15'
};

const differentDateInput: GetStepsByDateInput = {
  user_id: 'user123',
  date: '2024-01-16'
};

describe('getStepsByDate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return daily steps record for existing user and date', async () => {
    // Create test data
    const insertResult = await db.insert(dailyStepsTable)
      .values({
        user_id: 'user123',
        date: '2024-01-15',
        steps: 8500
      })
      .returning()
      .execute();

    const result = await getStepsByDate(testInput);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual('user123');
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.date.toISOString().slice(0, 10)).toEqual('2024-01-15');
    expect(result!.steps).toEqual(8500);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when no record exists for user and date', async () => {
    const result = await getStepsByDate(testInput);

    expect(result).toBeNull();
  });

  it('should return null when user exists but date does not match', async () => {
    // Create test data for different date
    await db.insert(dailyStepsTable)
      .values({
        user_id: 'user123',
        date: '2024-01-14', // Different date
        steps: 7200
      })
      .execute();

    const result = await getStepsByDate(testInput);

    expect(result).toBeNull();
  });

  it('should return null when date exists but user does not match', async () => {
    // Create test data for different user
    await db.insert(dailyStepsTable)
      .values({
        user_id: 'user999', // Different user
        date: '2024-01-15',
        steps: 6800
      })
      .execute();

    const result = await getStepsByDate(testInput);

    expect(result).toBeNull();
  });

  it('should return correct record when multiple records exist for same user', async () => {
    // Create multiple records for the same user with different dates
    await db.insert(dailyStepsTable)
      .values([
        {
          user_id: 'user123',
          date: '2024-01-14',
          steps: 7200
        },
        {
          user_id: 'user123',
          date: '2024-01-15',
          steps: 8500
        },
        {
          user_id: 'user123',
          date: '2024-01-16',
          steps: 9200
        }
      ])
      .execute();

    const result = await getStepsByDate(testInput);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual('user123');
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.date.toISOString().slice(0, 10)).toEqual('2024-01-15');
    expect(result!.steps).toEqual(8500);
  });

  it('should return correct record when multiple users have same date', async () => {
    // Create records for different users on the same date
    await db.insert(dailyStepsTable)
      .values([
        {
          user_id: 'user123',
          date: '2024-01-15',
          steps: 8500
        },
        {
          user_id: 'user456',
          date: '2024-01-15',
          steps: 7200
        }
      ])
      .execute();

    const result = await getStepsByDate(testInput);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual('user123');
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.date.toISOString().slice(0, 10)).toEqual('2024-01-15');
    expect(result!.steps).toEqual(8500);
  });

  it('should handle zero steps correctly', async () => {
    // Create record with zero steps
    await db.insert(dailyStepsTable)
      .values({
        user_id: 'user123',
        date: '2024-01-15',
        steps: 0
      })
      .execute();

    const result = await getStepsByDate(testInput);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual('user123');
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.date.toISOString().slice(0, 10)).toEqual('2024-01-15');
    expect(result!.steps).toEqual(0);
  });

  it('should handle high step counts correctly', async () => {
    // Create record with high step count
    await db.insert(dailyStepsTable)
      .values({
        user_id: 'user123',
        date: '2024-01-15',
        steps: 50000
      })
      .execute();

    const result = await getStepsByDate(testInput);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual('user123');
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.date.toISOString().slice(0, 10)).toEqual('2024-01-15');
    expect(result!.steps).toEqual(50000);
  });
});