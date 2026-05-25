import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { afterAll, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import { createRequire } from 'node:module';

dotenv.config();

const require = createRequire(import.meta.url);
const { ensureEnv, cleanTestData } = require('./_setup.js');

const rootDir = process.cwd();
const prismaDir = path.join(rootDir, 'backend', 'prisma');

export async function setup() {
  console.log('\n✓ Preparing test database...');
  ensureEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set. Cannot run tests.');
  }

  // Run migrations
  const migrateResult = spawnSync('npx', ['prisma', 'migrate', 'deploy', '--schema', path.join(prismaDir, 'schema.prisma')], {
    stdio: 'inherit',
    cwd: rootDir,
  });

  if (migrateResult.status !== 0) {
    throw new Error('Failed to run database migrations.');
  }

  // Optionally run seed
  const seedResult = spawnSync('node', [path.join(prismaDir, 'seed.js')], {
    stdio: 'inherit',
    cwd: rootDir,
  });

  if (seedResult.status !== 0) {
    console.warn('Warning: Seed script failed, but continuing with tests.');
  }

  console.log('✓ Test database ready.\n');
}

export async function teardown() {
  console.log('\n✓ Cleaning up test database...');
  await cleanTestData();
}

afterAll(async () => {
  await teardown();
});

beforeAll(async () => {
  await teardown();
});
