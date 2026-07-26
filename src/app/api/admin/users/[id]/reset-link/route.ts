import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // TODO: Verify Admin Session here in a real app
    // Currently relying on middleware for /api/admin/*

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");
    
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.update({
      where: { id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;

    return NextResponse.json({ link: resetLink }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/admin/users/[id]/reset-link]", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
