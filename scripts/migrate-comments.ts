import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import WebSocket from 'ws';

(global as any).WebSocket = WebSocket;

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const supabase = createClient(
  'https://zpjzrrlcwiugaufszjmq.supabase.co', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching comments from Supabase...");
  const { data: comments, error: cErr } = await supabase.from('comments').select('*');
  
  if (cErr) {
    console.error("Error fetching comments:", cErr);
    return;
  }
  
  console.log(`Found ${comments?.length || 0} comments.`);
  
  if (comments && comments.length > 0) {
    let successCount = 0;
    let failedCount = 0;
    
    // Check if the related post exists in our db before inserting
    for (const c of comments) {
      // Map old fields to new fields
      const content = c.content || '';
      const author = c.author_name || c.author || 'Anonymous';
      const likes = c.likes || 0;
      const avatarUrl = c.avatar_url || c.avatarUrl || null;
      // In old backend, the post ID might be ableId or post_id
      const postId = c.able_id || c.post_id || c.postId;
      
      if (!postId) {
        failedCount++;
        continue;
      }
      
      const post = await prisma.post.findUnique({
        where: { id: String(postId) }
      });
      
      if (!post) {
        // Skip comment if post no longer exists
        failedCount++;
        continue;
      }
      
      try {
        await prisma.comment.create({
          data: {
            id: String(c.id),
            content,
            author,
            likes,
            avatarUrl,
            postId: String(postId),
            createdAt: c.created_at ? new Date(c.created_at) : new Date()
          }
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to insert comment ${c.id}:`, err);
        failedCount++;
      }
    }
    console.log(`✅ Successfully migrated ${successCount} comments. Skipped/Failed: ${failedCount}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
