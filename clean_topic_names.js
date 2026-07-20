const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const WebSocket = require('ws');
global.WebSocket = WebSocket;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Fetching topics...");
  const { data: topics, error } = await supabase.from('topics').select('*');
  
  if (error) {
    console.error("Error fetching topics:", error);
    return;
  }
  
  console.log(`Found ${topics.length} topics. Cleaning names...`);
  
  let updatedCount = 0;
  for (const topic of topics) {
    if (topic.name.includes(':')) {
      const newName = topic.name.split(':')[0].trim();
      if (newName !== topic.name) {
        console.log(`Updating "${topic.name}" -> "${newName}"`);
        const { error: updateError } = await supabase
          .from('topics')
          .update({ name: newName })
          .eq('id', topic.id);
          
        if (updateError) {
          console.error(`Failed to update ${topic.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
  }
  
  console.log(`Finished. Updated ${updatedCount} topics.`);
}

main();
