const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
global.WebSocket = WebSocket;
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.from('topics').select('*');
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Topics in Supabase:", data);
  }
}

main();
