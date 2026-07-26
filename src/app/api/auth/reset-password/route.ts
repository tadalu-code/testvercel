import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải từ 6 ký tự trở lên" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Link khôi phục không hợp lệ hoặc đã hết hạn." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        failedLoginAttempts: 0 // Reset attempt counter as well
      },
    });

    return NextResponse.json({ message: "Đổi mật khẩu thành công!" }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
