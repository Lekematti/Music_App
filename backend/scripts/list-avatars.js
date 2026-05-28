require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase env vars missing');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey);

const listAll = async (prefix = '') => {
  const { data, error } = await client.storage.from('avatars').list(prefix, { limit: 100 });
  if (error) {
    console.error('Failed to list avatars:', error.message || error);
    return;
  }

  console.log('Listing for prefix:', prefix || '<root>');
  if (!data || data.length === 0) {
    console.log('  (empty)');
    return;
  }

  for (const item of data) {
    if (item.name && item.metadata && item.metadata?.isfolder) {
      console.log('DIR ', item.name);
    } else if (item.name && item.type === 'folder') {
      console.log('DIR ', item.name);
    } else {
      console.log('FILE', item.name);
    }
  }
};

(async () => {
  await listAll('');
  process.exit(0);
})();
