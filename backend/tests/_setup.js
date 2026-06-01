// Shared test helpers for vitest (moved here from tests/_setup.js)
const path = require('node:path');
// Shared helpers (Supabase mock is provided by Vitest-only setup file `setupVitest.js`)

function ensureEnv() {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'testsecret';
  // Provide a fallback fake database url for tests that don't hit a real DB
  if (!process.env.DATABASE_URL) process.env.DATABASE_URL = 'postgres://fake:fake@localhost:5432/fake';
}

async function cleanTestData() {
  try {
    const prismaPath = path.join(process.cwd(), 'backend', 'prisma', 'prismaClient.js');
    const prisma = require(prismaPath).default || require(prismaPath);

    if (!prisma || typeof prisma.$disconnect !== 'function') {
      return;
    }

    await prisma.rating.deleteMany({ where: { user: { email: { startsWith: 'test-', endsWith: '@example.com' } } } }).catch(()=>{});
    await prisma.song.deleteMany({ where: { user: { email: { startsWith: 'test-', endsWith: '@example.com' } } } }).catch(()=>{});
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-', endsWith: '@example.com' } } }).catch(()=>{});

    await prisma.$disconnect();
  } catch (err) {
    // best effort cleanup — tests may run without a real DB
    console.error('Cleanup error:', err);
  }
}

module.exports = {
  ensureEnv,
  cleanTestData,
};
