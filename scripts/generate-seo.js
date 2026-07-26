const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    console.log("=== Bắt đầu tạo SEO tự động ===");

    // 1. Cập nhật Sản phẩm
    console.log("1. Đang xử lý bảng products...");
    const { rows: products } = await client.query(`
      SELECT id, name, description, "metaTitle", "metaDescription", "metaKeywords"
      FROM products
      WHERE "metaTitle" IS NULL OR "metaTitle" = '' 
         OR "metaDescription" IS NULL OR "metaDescription" = ''
    `);

    let pCount = 0;
    for (const p of products) {
      const metaTitle = p.metaTitle || `${p.name} | Nông Dược Miền Nam`;
      
      const cleanDesc = stripHtml(p.description);
      const metaDesc = p.metaDescription || (cleanDesc.length > 155 ? cleanDesc.substring(0, 150) + '...' : cleanDesc) || `Mua ${p.name.toLowerCase()} chính hãng tại Nông Dược Miền Nam — chuyên cung cấp thuốc bảo vệ thực vật trên toàn quốc.`;
      
      const keywords = p.metaKeywords || `thuốc bảo vệ thực vật, ${p.name.toLowerCase()}, nông dược miền nam`;

      await client.query(`
        UPDATE products 
        SET "metaTitle" = $1, "metaDescription" = $2, "metaKeywords" = $3
        WHERE id = $4
      `, [
        metaTitle.substring(0, 100),
        metaDesc.substring(0, 200),
        keywords.substring(0, 200),
        p.id
      ]);
      pCount++;
    }
    console.log(`-> Đã tự động điền SEO cho ${pCount} sản phẩm.`);

    // 2. Cập nhật Bài viết
    console.log("2. Đang xử lý bảng posts...");
    const { rows: posts } = await client.query(`
      SELECT id, title, "shortDescription", content, "metaTitle", "metaDescription", "metaKeywords"
      FROM posts
      WHERE "metaTitle" IS NULL OR "metaTitle" = '' 
         OR "metaDescription" IS NULL OR "metaDescription" = ''
    `);

    let postCount = 0;
    for (const p of posts) {
      const metaTitle = p.metaTitle || `${p.title} | Tin tức Nông Dược`;
      
      const cleanDesc = p.shortDescription ? stripHtml(p.shortDescription) : stripHtml(p.content);
      const metaDesc = p.metaDescription || (cleanDesc.length > 155 ? cleanDesc.substring(0, 150) + '...' : cleanDesc) || `Đọc bài viết: ${p.title} trên trang tin tức Nông Dược Miền Nam.`;
      
      const keywords = p.metaKeywords || `tin tức nông nghiệp, ${p.title.toLowerCase()}, nông dược miền nam`;

      await client.query(`
        UPDATE posts 
        SET "metaTitle" = $1, "metaDescription" = $2, "metaKeywords" = $3
        WHERE id = $4
      `, [
        metaTitle.substring(0, 100),
        metaDesc.substring(0, 200),
        keywords.substring(0, 200),
        p.id
      ]);
      postCount++;
    }
    console.log(`-> Đã tự động điền SEO cho ${postCount} bài viết.`);

    console.log("=== Hoàn tất! ===");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
