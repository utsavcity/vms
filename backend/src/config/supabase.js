const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

// Node.js < 22 has no native WebSocket — pass the ws package as transport
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: ws,
    },
  }
);

module.exports = supabase;
