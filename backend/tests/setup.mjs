import { spawnSync } from 'node:child_process';
import path from 'node:path';

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
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE "Like" CASCADE;
      TRUNCATE TABLE "Song" CASCADE;
      TRUNCATE TABLE "User" CASCADE;
    `);
    console.log('✓ Test database cleaned.\n');
  } catch (error) {
    console.warn('Warning: Failed to truncate database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
