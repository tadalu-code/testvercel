import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password, recaptchaToken } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập email và mật khẩu" },
        { status: 400 }
      );
    }
    
    // Validate reCAPTCHA
    if (recaptchaToken) {
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
      const recaptchaRes = await fetch(verifyUrl, { method: "POST" });
      const recaptchaData = await recaptchaRes.json();
      
      if (!recaptchaData.success || recaptchaData.score < 0.5) {
        return NextResponse.json(
          { error: "Phát hiện spam đăng ký, vui lòng thử lại." },
          { status: 400 }
        );
      }
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPhone = /^[0-9]{10,11}$/.test(email);

    let authEmail = null;
    let authPhone = null;
    let authUsername = null;

    if (isEmail) {
      authEmail = email;
    } else if (isPhone) {
      authPhone = email;
    } else {
      authUsername = email;
    }

    // Check if user exists (by any of the fields)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: email },
          { username: email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email, SĐT hoặc Tên đăng nhập đã được sử dụng" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: authEmail,
        phone: authPhone,
        username: authUsername,
        password: hashedPassword,
        role: "user",
      }
    });

    // Tạo Notification nếu thiếu email
    if (!authEmail) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Hoàn thiện hồ sơ",
          message: "Vui lòng cập nhật Email và thông tin cá nhân để bảo mật tài khoản tốt hơn.",
          type: "SYSTEM",
          linkUrl: "/user/account/profile"
        }
      });
    }

    return NextResponse.json(
      { message: "Đăng ký thành công", user: { id: user.id, email: user.email || user.phone || user.username } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi đăng ký" },
      { status: 500 }
    );
  }
}
