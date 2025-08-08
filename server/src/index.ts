import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas and handlers
import { 
  createDailyStepsInputSchema,
  updateDailyStepsInputSchema,
  getUserStepsInputSchema,
  getStepsByDateInputSchema
} from './schema';
import { createDailySteps } from './handlers/create_daily_steps';
import { getUserSteps } from './handlers/get_user_steps';
import { getStepsByDate } from './handlers/get_steps_by_date';
import { updateDailySteps } from './handlers/update_daily_steps';
import { deleteDailySteps } from './handlers/delete_daily_steps';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create or update daily steps for a user
  createDailySteps: publicProcedure
    .input(createDailyStepsInputSchema)
    .mutation(({ input }) => createDailySteps(input)),

  // Get all steps records for a user (with optional date range filtering)
  getUserSteps: publicProcedure
    .input(getUserStepsInputSchema)
    .query(({ input }) => getUserSteps(input)),

  // Get steps for a specific user and date
  getStepsByDate: publicProcedure
    .input(getStepsByDateInputSchema)
    .query(({ input }) => getStepsByDate(input)),

  // Update steps count for an existing record
  updateDailySteps: publicProcedure
    .input(updateDailyStepsInputSchema)
    .mutation(({ input }) => updateDailySteps(input)),

  // Delete a daily steps record by ID
  deleteDailySteps: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteDailySteps(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Daily Steps Tracker TRPC server listening at port: ${port}`);
}

start();