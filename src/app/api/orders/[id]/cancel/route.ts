import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reason } = await request.json();
    if (!reason) {
      return NextResponse.json({ error: "Vui lòng cung cấp lý do hủy" }, { status: 400 });
    }

    const resolvedParams = await params;
    const order = await prisma.order.findUnique({ where: { id: resolvedParams.id } });
    
    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    if (order.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Đơn hàng đã được xử lý hoặc giao hàng, không thể hủy" }, { status: 400 });
    }

    const hoursSinceCreation = (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return NextResponse.json({ error: "Đã quá 24h kể từ khi đặt hàng, không thể hủy" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: resolvedParams.id },
      data: {
        isCancelRequested: true,
        cancelReason: reason
      }
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
