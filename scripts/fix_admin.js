const fs = require('fs');
const paths = [
  'src/app/api/categories/[id]/route.ts',
  'src/app/api/contacts/route.ts',
  'src/app/api/contacts/[id]/route.ts',
  'src/app/api/orders/[id]/route.ts',
  'src/app/api/posts/route.ts',
  'src/app/api/posts/[id]/route.ts'
];

for (const p of paths) {
  if (fs.existsSync(p)) {
    let text = fs.readFileSync(p, 'utf8');
    text = text.replace(/import\s+\{\s*getSupabaseAdmin\s*\}\s+from\s+["']@\/lib\/supabase-admin["'];/g, 'import { supabaseAdmin } from "@/lib/supabase-admin";');
    text = text.replace(/const\s+[a-zA-Z0-9_]+\s*=\s*getSupabaseAdmin\(\);/g, '');
    text = text.replace(/getSupabaseAdmin\(\)/g, 'supabaseAdmin');
    fs.writeFileSync(p, text);
  }
}
