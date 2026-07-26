import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@nongduoc.vn'
      }
    }
  });

  console.log(`Found ${users.length} users with fake emails.`);

  for (const user of users) {
    if (!user.email) continue;
    const fakeStr = user.email.replace('@nongduoc.vn', '');
    
    // Check if it's a phone number (e.g. 10-11 digits)
    const isPhone = /^[0-9]{10,11}$/.test(fakeStr);
    
    try {
      if (isPhone) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email: null,
            phone: fakeStr
          }
        });
        console.log(`Updated user ${user.id} -> moved to phone: ${fakeStr}`);
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email: null,
            username: fakeStr
          }
        });
        console.log(`Updated user ${user.id} -> moved to username: ${fakeStr}`);
      }
    } catch (e: any) {
      console.error(`Failed to update user ${user.id}:`, e.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
