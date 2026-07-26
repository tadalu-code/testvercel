import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) {
      return NextResponse.json({ error: "Không tìm thấy thông báo" }, { status: 404 });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/user/notifications/[id]/read]", error);
    return NextResponse.json({ error: "Lỗi cập nhật thông báo" }, { status: 500 });
  }
}
