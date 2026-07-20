const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({ take: 2 });
  console.log("Found posts:", posts.length);
  if (posts.length > 0) {
    console.log("Sample post:", posts[0]);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
