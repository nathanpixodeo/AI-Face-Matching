import { env } from './config/env';
import { connectDatabase } from './config/database';
import { seedPlans } from './config/seed';
import { buildServer } from './server';
import { startFaceDetectWorker } from './jobs/face-detect.job';

async function main() {
  await connectDatabase();
  await seedPlans();

  const app = await buildServer();

  startFaceDetectWorker();

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
