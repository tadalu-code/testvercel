const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');
// first remove all `n literals and malformed schemas
c = c.replace(/`n\s*@@schema\("public"\)/g, '');
c = c.replace(/@@map\("(.*?)"\)\s*@@schema\("public"\)/g, '@@map("$1")');
c = c.replace(/@@map\("(.*?)"\)/g, '@@map("$1")\n  @@schema("public")');
fs.writeFileSync('prisma/schema.prisma', c);
