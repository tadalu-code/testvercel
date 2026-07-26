import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        gender: true,
        dob: true,
        avatarUrl: true,
        username: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error: any) {
    console.error("[GET /api/user/profile]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const { name, phone, gender, dob, avatarUrl, username, email } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    
    if (email) {
      const exist = await prisma.user.findFirst({ where: { email, id: { not: userId } } });
      if (exist) return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 400 });
      updateData.email = email;
    }
    
    if (phone) {
      const exist = await prisma.user.findFirst({ where: { phone, id: { not: userId } } });
      if (exist) return NextResponse.json({ error: "Số điện thoại này đã được sử dụng" }, { status: 400 });
      updateData.phone = phone;
    }
    
    if (username) {
      const exist = await prisma.user.findFirst({ where: { username, id: { not: userId } } });
      if (exist) return NextResponse.json({ error: "Tên đăng nhập này đã được sử dụng" }, { status: 400 });
      updateData.username = username;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ data: updatedUser, success: true });
  } catch (error: any) {
    console.error("[PUT /api/user/profile]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
