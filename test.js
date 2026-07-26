const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found!");
      return;
    }
    console.log("User ID:", user.id);
    const addr = await prisma.userAddress.create({
      data: {
        userId: user.id,
        fullName: 'Test',
        phone: '123',
        province: JSON.stringify({ code: "01", name: "Hà Nội" }),
        commune: JSON.stringify({ code: "001", name: "Phường" }),
        detail: 'd',
        isDefault: true
      }
    });
    console.log("Created address successfully:", addr);
  } catch (e) {
    console.error("PRISMA ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
