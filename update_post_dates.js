const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const crypto = require('crypto');
const WebSocket = require('ws');
global.WebSocket = WebSocket;
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE_URL_OLD = 'https://api.nongduocmiennam.vn:5056/api';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPostDates(slug) {
  return new Promise((resolve, reject) => {
    https.get(`${BASE_URL_OLD}/post/show/${encodeURIComponent(slug)}`, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const postData = parsed?.data || {};
          resolve({
            createdAt: postData.created_at || null,
            updatedAt: postData.updated_at || null
          });
        } catch (e) {
          resolve({ createdAt: null, updatedAt: null });
        }
      });
    }).on('error', (e) => resolve({ createdAt: null, updatedAt: null }));
  });
}

async function run() {
  console.log("Bắt đầu cập nhật ngày tạo (createdAt) cho các bài viết...");
  
  const { data: posts, error } = await supabase.from('posts').select('id, slug, title');
  if (error) {
    console.error("Lỗi lấy danh sách bài viết từ Supabase:", error);
    return;
  }
  
  console.log(`Tìm thấy ${posts.length} bài viết trong DB.`);
  
  let successCount = 0;
  for (const post of posts) {
    if (!post.slug) continue;
    
    const { createdAt, updatedAt } = await fetchPostDates(post.slug);
    
    if (createdAt) {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ createdAt: createdAt, updatedAt: updatedAt || createdAt })
        .eq('id', post.id);
        
      if (updateError) {
        console.error(`  - Lỗi cập nhật ngày tháng cho bài viết ${post.slug}:`, updateError.message);
      } else {
        console.log(`  + Cập nhật ngày ${createdAt} cho: ${post.slug}`);
        successCount++;
      }
    } else {
      console.log(`  - Không tìm thấy ngày tạo từ API cũ cho bài viết này: ${post.slug}`);
    }
    
    await delay(300); // Tránh rate limit
  }
  
  console.log(`Hoàn tất! Đã cập nhật ngày tạo cho ${successCount}/${posts.length} bài viết.`);
}

run().catch(console.error);
