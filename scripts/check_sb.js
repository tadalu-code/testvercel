const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function main() {
  console.log("Checking Supabase connection...");
  const { data, error } = await supabase.from('posts').select('id, title, topicId').limit(5);
  
  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Posts found:", data.length);
    console.log(data);
  }
}

main();
