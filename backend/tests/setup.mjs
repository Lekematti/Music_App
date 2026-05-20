import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { afterAll, beforeAll } from 'vitest';
import dotenv from 'dotenv';

dotenv.config();

const rootDir = process.cwd();
const prismaDir = path.join(rootDir, 'backend', 'prisma');

export async function setup() {
  console.log('\n✓ Preparing test database...');
  
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

  if (!process.env.DATABASE_URL) {
    return;
  }

  // Truncate all tables
  const { default: prisma } = await import('../prisma/prismaClient.js');

  if (!prisma || typeof prisma.$executeRawUnsafe !== 'function') {
    return;
  }

  try {
    // Delete only test data created by tests (email starts with test- and ends with @example.com)
    await prisma.like.deleteMany({
      where: {
        user: { email: { startsWith: 'test-', endsWith: '@example.com' } }
      }
    });

    await prisma.song.deleteMany({
      where: {
        user: { email: { startsWith: 'test-', endsWith: '@example.com' } }
      }
    });

    await prisma.user.deleteMany({
      where: { email: { startsWith: 'test-', endsWith: '@example.com' } }
    });

    console.log('✓ Test data user data cleaned (real data untouched).\n');
  } catch (error) {
    console.warn('Warning: Failed to truncate database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

afterAll(async () => {
  await teardown();
});

beforeAll(async () => {
  await teardown();
});
