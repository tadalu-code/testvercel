const fs = require('fs');

fetch('https://nongduocmiennam.vn/static/js/main.04b7ed01.js')
  .then(res => res.text())
  .then(js => {
    // Tìm các chuỗi string trông giống như path API
    const matches = js.match(/(?:\"|\')([^\"\'\n\r]*\/[^\"\'\n\r]*)(?:\"|\')/g) || [];
    const unique = [...new Set(matches)];
    const apiPaths = unique.filter(p => p.toLowerCase().includes('post') || p.toLowerCase().includes('article') || p.toLowerCase().includes('news') || p.toLowerCase().includes('blog'));
    console.log(apiPaths.slice(0, 30));
  });
