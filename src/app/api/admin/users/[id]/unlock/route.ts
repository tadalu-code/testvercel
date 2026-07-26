import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

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
