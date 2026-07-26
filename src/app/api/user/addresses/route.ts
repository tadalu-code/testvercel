import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const addresses = await prisma.userAddress.findMany({
      where: { userId: userId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json({ data: addresses });
  } catch (error: any) {
    console.error("[GET /api/user/addresses]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized hoặc phiên đăng nhập quá cũ, vui lòng đăng xuất và đăng nhập lại." }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const { fullName, phone, province, commune, detail, isDefault } = body;

    if (!fullName || !phone || !province || !commune || !detail) {
      return NextResponse.json({ error: "Thiếu thông tin địa chỉ" }, { status: 400 });
    }

    // Verify if user actually exists in the database (handles ghost sessions)
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return NextResponse.json({ error: "Tài khoản không tồn tại hoặc đã bị xóa. Vui lòng đăng xuất và đăng nhập lại." }, { status: 401 });
    }

    // Check if this is the user's first address
    const existingCount = await prisma.userAddress.count({
      where: { userId: userId }
    });

    const shouldBeDefault = existingCount === 0 || isDefault;

    // If setting as default, update all other addresses to not default
    if (shouldBeDefault && existingCount > 0) {
      await prisma.userAddress.updateMany({
        where: { userId: userId },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.userAddress.create({
      data: {
        userId: userId,
        fullName,
        phone,
        province: JSON.stringify({ code: province.code, name: province.name }),
        commune: JSON.stringify({ code: commune.code, name: commune.name }),
        detail,
        isDefault: shouldBeDefault
      }
    });

    return NextResponse.json({ data: newAddress }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/user/addresses]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
