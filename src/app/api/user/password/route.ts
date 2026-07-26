import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const { old_password, new_password } = body;

    if (!new_password || new_password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "Người dùng không tồn tại" }, { status: 404 });
    }

    if (user.password) {
      if (!old_password) {
        return NextResponse.json({ error: "Vui lòng nhập mật khẩu cũ" }, { status: 400 });
      }

      const isValid = await bcrypt.compare(old_password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Mật khẩu cũ không chính xác" }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true, message: user.password ? "Đổi mật khẩu thành công" : "Thêm mật khẩu thành công" });
  } catch (error: any) {
    console.error("[POST /api/user/password]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
