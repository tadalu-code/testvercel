import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;

    const user = await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    return NextResponse.json({ message: "Mở khóa thành công", user });
  } catch (error) {
    console.error("[UNLOCK_USER]", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi mở khóa" },
      { status: 500 }
    );
  }
}
