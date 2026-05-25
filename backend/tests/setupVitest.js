// Vitest-only setup: top-level mocks that must be hoisted before modules load
const { createMockSupabase } = require('./helpers/supabaseMock');

// Top-level vi.mock ensures the mock is hoisted by Vitest and active before any module imports
vi.mock('@supabase/supabase-js', () => ({ createClient: () => createMockSupabase() }));
