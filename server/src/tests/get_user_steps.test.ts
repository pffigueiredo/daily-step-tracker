import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyStepsTable } from '../db/schema';
import { type GetUserStepsInput } from '../schema';
import { getUserSteps } from '../handlers/get_user_steps';

describe('getUserSteps', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve all steps for a user when no date filters provided', async () => {
    // Create test data for multiple users and dates
    await db.insert(dailyStepsTable).values([
      {
        user_id: 'user1',
        date: '2024-01-01',
        steps: 5000,
      },
      {
        user_id: 'user1',
        date: '2024-01-02',
        steps: 7500,
      },
      {
        user_id: 'user1',
        date: '2024-01-03',
        steps: 10000,
      },
      {
        user_id: 'user2',
        date: '2024-01-01',
        steps: 3000,
      }
    ]).execute();

    const input: GetUserStepsInput = {
      user_id: 'user1'
    };

    const result = await getUserSteps(input);

    // Should return only user1's records
    expect(result).toHaveLength(3);
    
    // Verify all records belong to user1
    result.forEach(steps => {
      expect(steps.user_id).toEqual('user1');
    });

    // Should be ordered by date (most recent first)
    expect(result[0].date).toEqual(new Date('2024-01-03'));
    expect(result[1].date).toEqual(new Date('2024-01-02'));
    expect(result[2].date).toEqual(new Date('2024-01-01'));

    // Verify steps data
    expect(result[0].steps).toEqual(10000);
    expect(result[1].steps).toEqual(7500);
    expect(result[2].steps).toEqual(5000);
  });

  it('should filter by start_date when provided', async () => {
    // Create test data spanning multiple dates
    await db.insert(dailyStepsTable).values([
      {
        user_id: 'user1',
        date: '2024-01-01',
        steps: 5000,
      },
      {
        user_id: 'user1',
        date: '2024-01-05',
        steps: 7500,
      },
      {
        user_id: 'user1',
        date: '2024-01-10',
        steps: 10000,
      }
    ]).execute();

    const input: GetUserStepsInput = {
      user_id: 'user1',
      start_date: '2024-01-03'
    };

    const result = await getUserSteps(input);

    // Should return only records from 2024-01-03 onwards
    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-10'));
    expect(result[1].date).toEqual(new Date('2024-01-05'));
  });

  it('should filter by end_date when provided', async () => {
    // Create test data spanning multiple dates
    await db.insert(dailyStepsTable).values([
      {
        user_id: 'user1',
        date: '2024-01-01',
        steps: 5000,
      },
      {
        user_id: 'user1',
        date: '2024-01-05',
        steps: 7500,
      },
      {
        user_id: 'user1',
        date: '2024-01-10',
        steps: 10000,
      }
    ]).execute();

    const input: GetUserStepsInput = {
      user_id: 'user1',
      end_date: '2024-01-07'
    };

    const result = await getUserSteps(input);

    // Should return only records up to 2024-01-07
    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-05'));
    expect(result[1].date).toEqual(new Date('2024-01-01'));
  });

  it('should filter by both start_date and end_date when provided', async () => {
    // Create test data spanning multiple dates
    await db.insert(dailyStepsTable).values([
      {
        user_id: 'user1',
        date: '2024-01-01',
        steps: 5000,
      },
      {
        user_id: 'user1',
        date: '2024-01-05',
        steps: 7500,
      },
      {
        user_id: 'user1',
        date: '2024-01-10',
        steps: 10000,
      },
      {
        user_id: 'user1',
        date: '2024-01-15',
        steps: 12000,
      }
    ]).execute();

    const input: GetUserStepsInput = {
      user_id: 'user1',
      start_date: '2024-01-03',
      end_date: '2024-01-12'
    };

    const result = await getUserSteps(input);

    // Should return only records between 2024-01-03 and 2024-01-12
    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-10'));
    expect(result[1].date).toEqual(new Date('2024-01-05'));
  });

  it('should return empty array when user has no steps data', async () => {
    // Create data for a different user
    await db.insert(dailyStepsTable).values([
      {
        user_id: 'user1',
        date: '2024-01-01',
        steps: 5000,
      }
    ]).execute();

    const input: GetUserStepsInput = {
      user_id: 'nonexistent_user'
    };

    const result = await getUserSteps(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when date range contains no data', async () => {
    // Create test data outside the query range
    await db.insert(dailyStepsTable).values([
      {
        user_id: 'user1',
        date: '2024-01-01',
        steps: 5000,
      },
      {
        user_id: 'user1',
        date: '2024-01-15',
        steps: 7500,
      }
    ]).execute();

    const input: GetUserStepsInput = {
      user_id: 'user1',
      start_date: '2024-01-05',
      end_date: '2024-01-10'
    };

    const result = await getUserSteps(input);

    expect(result).toHaveLength(0);
  });

  it('should return correct data types for all fields', async () => {
    await db.insert(dailyStepsTable).values([
      {
        user_id: 'user1',
        date: '2024-01-01',
        steps: 5000,
      }
    ]).execute();

    const input: GetUserStepsInput = {
      user_id: 'user1'
    };

    const result = await getUserSteps(input);

    expect(result).toHaveLength(1);
    
    const step = result[0];
    expect(typeof step.id).toBe('number');
    expect(typeof step.user_id).toBe('string');
    expect(step.date).toBeInstanceOf(Date);
    expect(typeof step.steps).toBe('number');
    expect(step.created_at).toBeInstanceOf(Date);
    expect(step.updated_at).toBeInstanceOf(Date);
  });
});