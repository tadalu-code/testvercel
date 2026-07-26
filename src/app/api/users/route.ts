import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lockoutUntil: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const mappedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || 'Khách',
      role: user.role,
      createdAt: user.createdAt,
      lastSignInAt: user.updatedAt,
      lockoutUntil: user.lockoutUntil
    }));

    // Sort by role: admin -> staff -> user
    mappedUsers.sort((a, b) => {
      const roleWeight = { admin: 1, staff: 2, user: 3 } as any;
      const weightA = roleWeight[a.role] || 3;
      const weightB = roleWeight[b.role] || 3;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ data: mappedUsers });
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách người dùng" }, { status: 500 });
  }
}
