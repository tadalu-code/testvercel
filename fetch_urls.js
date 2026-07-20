const fs = require('fs');

fetch('https://nongduocmiennam.vn/static/js/main.04b7ed01.js')
  .then(res => res.text())
  .then(js => {
    const urls = js.match(/https?:\/\/[^\s`"'\\]+/g) || [];
    console.log([...new Set(urls)].slice(0, 50));
  });
