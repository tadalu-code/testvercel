import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE_URL = 'https://api.nongduocmiennam.vn:5056/api';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrate() {
  console.log("Starting Migration...");

  // 1. Migrate Categories
  console.log("Fetching Categories...");
  const catRes = await fetch(`${BASE_URL}/category/public/shows`);
  const catData = await catRes.json();
  const categories = Array.isArray(catData) ? catData : (catData?.data?.categories || catData?.data?.items || catData?.data || []);
  
  console.log(`Found ${categories.length} categories.`);
  for (const cat of categories) {
    if (!cat.name) continue;
    
    // Check if exists
    const { data: exists } = await supabaseAdmin.from('categories').select('id').eq('name', cat.name).single();
    if (!exists) {
      await supabaseAdmin.from('categories').insert([{
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        description: cat.description || null,
        imageUrl: cat.imageUrl || null
      }]);
    }
  }

  // 2. Fetch all local categories for mapping
  const { data: localCategories } = await supabaseAdmin.from('categories').select('*');
  const catMap = new Map();
  if (localCategories) {
    localCategories.forEach(c => catMap.set(c.name, c.id));
  }

  // 3. Migrate Products
  console.log("Fetching Products...");
  const prodRes = await fetch(`${BASE_URL}/product/public/shows?page=1&limit=500`);
  const prodData = await prodRes.json();
  const products = prodData?.data?.products || prodData?.data?.data || [];

  console.log(`Found ${products.length} products.`);
  for (const p of products) {
    if (!p.name) continue;

    // Mapping category ID
    let categoryId = null;
    if (p.category?.name && catMap.has(p.category.name)) {
      categoryId = catMap.get(p.category.name);
    } else if (p.category_name && catMap.has(p.category_name)) {
      categoryId = catMap.get(p.category_name);
    }

    // Check if exists
    const { data: exists } = await supabaseAdmin.from('products').select('id').eq('name', p.name).single();
    if (!exists) {
      let imagesUrl = [];
      if (p.imagesUrl && Array.isArray(p.imagesUrl)) {
        imagesUrl = p.imagesUrl;
      } else if (typeof p.imagesUrl === 'string') {
        try {
          const cleanJson = p.imagesUrl.trim().replace(/^['"]|['"]$/g, '').replace(/\\"/g, '"');
          const parsed = JSON.parse(cleanJson);
          imagesUrl = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          const regex = /https?:\/\/[^"\\\s/]+[^"\\\s]+/g;
          imagesUrl = p.imagesUrl.match(regex) || [];
        }
      }

      await supabaseAdmin.from('products').insert([{
        name: p.name,
        slug: p.slug || p.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        description: p.description || null,
        imagesUrl: imagesUrl,
        price: p.price || null,
        salePrice: p.salePrice || null,
        stock: p.stock || 100,
        unit: p.unit || null,
        isPublished: true,
        categoryId
      }]);
    }
  }

  // 4. Migrate Topics (for posts)
  console.log("Fetching Topics...");
  const topicRes = await fetch(`${BASE_URL}/topic/public/shows`);
  const topicData = await topicRes.json();
  const topics = topicData?.data?.topics || topicData?.data || [];

  console.log(`Found ${topics.length} topics.`);
  for (const t of topics) {
    if (!t.name) continue;
    const { data: exists } = await supabaseAdmin.from('topics').select('id').eq('name', t.name).single();
    if (!exists) {
      await supabaseAdmin.from('topics').insert([{
        name: t.name,
        slug: t.slug || t.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        description: t.description || null
      }]);
    }
  }

  // 5. Fetch all local topics for mapping
  const { data: localTopics } = await supabaseAdmin.from('topics').select('*');
  const topicMap = new Map();
  if (localTopics) {
    localTopics.forEach(t => topicMap.set(t.name, t.id));
  }

  // 6. Migrate Posts
  console.log("Fetching Posts...");
  const postRes = await fetch(`${BASE_URL}/post/public/shows?page=1&limit=500`);
  const postData = await postRes.json();
  const posts = postData?.data?.posts || postData?.data?.data || [];

  console.log(`Found ${posts.length} posts.`);
  for (const p of posts) {
    if (!p.title) continue;

    let topicId = null;
    if (p.topic?.name && topicMap.has(p.topic.name)) {
      topicId = topicMap.get(p.topic.name);
    }

    const { data: exists } = await supabaseAdmin.from('posts').select('id').eq('title', p.title).single();
    if (!exists) {
      await supabaseAdmin.from('posts').insert([{
        title: p.title,
        slug: p.slug || p.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        content: p.content || p.summary || '',
        imageUrl: p.imageUrl || null,
        topicId: topicId,
        isPublished: true,
        authorId: null
      }]);
    }
  }

  console.log("Migration Complete!");
}

migrate().catch(console.error);
