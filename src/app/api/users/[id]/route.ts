import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "staff", "user"].includes(role)) {
      return NextResponse.json({ error: "Vai trò không hợp lệ" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });

    return NextResponse.json({ message: "Cập nhật thành công", data: user });
  } catch (error: any) {
    console.error("[PATCH /api/users/[id]]", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }
    return NextResponse.json({ error: "Lỗi cập nhật vai trò người dùng" }, { status: 500 });
  }
}
