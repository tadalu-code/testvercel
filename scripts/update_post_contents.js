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

async function fetchPostContent(slug) {
  return new Promise((resolve, reject) => {
    https.get(`${BASE_URL_OLD}/post/show/${encodeURIComponent(slug)}`, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const postData = parsed?.data || {};
          resolve({
            content: postData.content || '',
            shortDescription: postData.short_description || ''
          });
        } catch (e) {
          resolve({ content: '', shortDescription: '' });
        }
      });
    }).on('error', (e) => resolve({ content: '', shortDescription: '' }));
  });
}

async function run() {
  console.log("Bắt đầu cập nhật nội dung (content) cho các bài viết...");
  
  const { data: posts, error } = await supabase.from('posts').select('id, slug, title');
  if (error) {
    console.error("Lỗi lấy danh sách bài viết từ Supabase:", error);
    return;
  }
  
  console.log(`Tìm thấy ${posts.length} bài viết trong DB.`);
  
  let successCount = 0;
  for (const post of posts) {
    if (!post.slug) continue;
    
    console.log(`Đang tải nội dung cho: ${post.title} (${post.slug})...`);
    const { content, shortDescription } = await fetchPostContent(post.slug);
    
    if (content || shortDescription) {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ content: content, shortDescription: shortDescription })
        .eq('id', post.id);
        
      if (updateError) {
        console.error(`  - Lỗi cập nhật bài viết ${post.slug}:`, updateError.message);
      } else {
        console.log(`  + Thành công cập nhật nội dung.`);
        successCount++;
      }
    } else {
      console.log(`  - Không tìm thấy nội dung từ API cũ cho bài viết này.`);
    }
    
    await delay(300); // Tránh rate limit
  }
  
  console.log(`Hoàn tất! Đã cập nhật nội dung cho ${successCount}/${posts.length} bài viết.`);
}

run().catch(console.error);
