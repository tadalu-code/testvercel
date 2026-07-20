const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const crypto = require('crypto');
const WebSocket = require('ws');
global.WebSocket = WebSocket;
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log("1. Lấy danh sách Topics từ API cũ...");
  const topicRes = await fetchJson('https://api.nongduocmiennam.vn:5056/api/topic/public/shows');
  const topics = topicRes.data.topics || topicRes.data || [];
  
  console.log(`Tìm thấy ${topics.length} topics. Đang đồng bộ vào Supabase...`);
  
  for (const t of topics) {
    if (!t.name) continue;
    const slug = t.slug || t.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    // Check if exists
    const { data: exists } = await supabase.from('topics').select('id').eq('name', t.name).single();
    if (!exists) {
      const insertResult = await supabase.from('topics').insert([{
        id: crypto.randomUUID(),
        name: t.name,
        slug: slug
      }]);
      if (insertResult.error) {
        console.error(`  - Lỗi thêm topic ${t.name}:`, insertResult.error.message);
      } else {
        console.log(`  + Đã thêm topic: ${t.name}`);
      }
    }
  }

  // Lấy toàn bộ topics từ Supabase để lấy ID ánh xạ
  const { data: localTopics } = await supabase.from('topics').select('*');
  const topicMap = new Map();
  if (localTopics) {
    localTopics.forEach(t => topicMap.set(t.name, t.id));
  }

  console.log("\n2. Lấy danh sách Posts từ API cũ để cập nhật Topic...");
  const postRes = await fetchJson('https://api.nongduocmiennam.vn:5056/api/post/public/shows?page=1&limit=500');
  const posts = postRes.data.posts || postRes.data || [];

  console.log(`Tìm thấy ${posts.length} posts. Đang cập nhật topicId vào DB Supabase...`);
  let updateCount = 0;

  for (const p of posts) {
    if (!p.title || !p.slug) continue;
    
    if (p.topics && p.topics.length > 0 && p.topics[0].name) {
      const topicId = topicMap.get(p.topics[0].name);
      if (topicId) {
        // Cập nhật post trong Supabase dựa vào slug
        const { data, error } = await supabase
          .from('posts')
          .update({ topicId: topicId })
          .eq('slug', p.slug)
          .select();

        if (error) {
          console.error(`  - Lỗi cập nhật bài: ${p.title} -`, error.message);
        } else if (data && data.length > 0) {
          console.log(`  + Cập nhật thành công: [${p.topics[0].name}] ${p.title}`);
          updateCount++;
        }
      }
    }
  }

  console.log(`\nHoàn tất! Đã cập nhật chuyên mục cho ${updateCount} bài viết.`);
}

main().catch(console.error);
