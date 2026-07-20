const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

const req = https.request('https://api.nongduocmiennam.vn:5056/api/product/public/shows?page=1&limit=32', { rejectUnauthorized: false }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const products = json.data.products;
    
    // CSV Header
    let csv = 'id,name,slug,description,specifications,imagesUrl,isPublished,price,salePrice,stock,unit,createdAt,updatedAt\n';
    
    // Excape function for CSV
    const escapeCSV = (field) => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      if (str.includes('\"') || str.includes(',') || str.includes('\\n')) {
        return '\"' + str.replace(/\"/g, '\"\"') + '\"';
      }
      return str;
    };
    
    products.forEach(p => {
      const id = crypto.randomUUID();
      const name = p.name;
      const slug = p.slug;
      const description = p.content;
      const specifications = p.seoDescription;
      // Format array for Supabase CSV import: JSON stringified array of strings
      const imagesUrl = JSON.stringify(p.imagesUrl || []);
      const isPublished = true;
      const price = parseFloat(p.originalPrice || 0);
      const salePrice = parseFloat(p.salePrice || 0);
      const stock = parseInt(p.stock || 0);
      const unit = p.unit || '';
      const createdAt = new Date(p.createdAt).toISOString();
      const updatedAt = new Date(p.updatedAt).toISOString();
      
      const row = [
        id, name, slug, description, specifications, imagesUrl, isPublished, price, salePrice, stock, unit, createdAt, updatedAt
      ].map(escapeCSV).join(',');
      
      csv += row + '\n';
    });
    
    fs.writeFileSync('public/products.csv', csv);
    console.log('CSV created successfully at public/products.csv');
  });
});
req.on('error', console.error);
req.end();