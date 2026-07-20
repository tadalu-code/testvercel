const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

// Hàm fetch Promise
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

// Escape function for CSV
const escapeCSV = (field) => {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes('\"') || str.includes(',') || str.includes('\\n')) {
    return '\"' + str.replace(/\"/g, '\"\"') + '\"';
  }
  return str;
};

async function main() {
  console.log('Đang lấy danh sách bài viết từ API cũ...');
  try {
    const listRes = await fetchJson('https://api.nongduocmiennam.vn:5056/api/post/public/shows?page=1&limit=100');
    const postsList = listRes.data.posts || [];
    console.log(`Tìm thấy ${postsList.length} bài viết. Bắt đầu lấy chi tiết từng bài...`);

    let csv = 'id,title,slug,thumbnail,content,shortDescription,isPublished,createdAt,updatedAt\n';

    for (let i = 0; i < postsList.length; i++) {
      const p = postsList[i];
      const slug = p.slug;
      if (!slug) continue;
      
      console.log(`[${i+1}/${postsList.length}] Đang lấy chi tiết: ${slug}`);
      let detail = p;
      try {
        const detailRes = await fetchJson(`https://api.nongduocmiennam.vn:5056/api/post/public/show-by-slug/${encodeURIComponent(slug)}`);
        if (detailRes && detailRes.data) {
          detail = detailRes.data;
        } else {
          // Fallback to another endpoint if needed
          const detailRes2 = await fetchJson(`https://api.nongduocmiennam.vn:5056/api/post/show/${encodeURIComponent(slug)}`);
          if (detailRes2 && detailRes2.data) detail = detailRes2.data;
        }
      } catch (err) {
        console.log(`  -> Lỗi khi lấy chi tiết ${slug}, dùng dữ liệu thô.`);
      }

      const id = crypto.randomUUID();
      const title = detail.name || detail.title || p.name || '';
      const thumbnail = detail.thumbnail || detail.image || p.thumbnail || '';
      const content = detail.content || detail.body || p.content || '';
      const shortDescription = detail.description || detail.shortDescription || p.description || '';
      const isPublished = true;
      const createdAt = detail.createdAt || p.createdAt ? new Date(detail.createdAt || p.createdAt).toISOString() : new Date().toISOString();
      const updatedAt = detail.updatedAt || p.updatedAt ? new Date(detail.updatedAt || p.updatedAt).toISOString() : new Date().toISOString();
      
      const row = [
        id, title, slug, thumbnail, content, shortDescription, isPublished, createdAt, updatedAt
      ].map(escapeCSV).join(',');
      
      csv += row + '\n';
      
      // Delay nhỏ để tránh quá tải server cũ
      await new Promise(r => setTimeout(r, 100));
    }

    fs.writeFileSync('public/posts.csv', csv);
    console.log('\nThành công! Đã tạo file public/posts.csv với đầy đủ nội dung.');
  } catch (error) {
    console.error('Lỗi tổng thể:', error);
  }
}

main();
