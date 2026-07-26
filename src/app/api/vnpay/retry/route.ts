import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { generateVNPayUrl } from "@/lib/vnpay";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Thiếu orderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: "Đơn hàng không tồn tại" }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    if (order.paymentMethod !== "VNPAY" || order.paymentStatus !== "UNPAID" || order.status !== "PENDING") {
      return NextResponse.json({ error: "Đơn hàng không đủ điều kiện thanh toán lại" }, { status: 400 });
    }

    const ipAddr = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const orderInfo = `Thanh toan don hang ${order.id}`;
    const vnpUrl = generateVNPayUrl(ipAddr.split(',')[0], order.totalAmount, orderInfo, order.id);
    
    return NextResponse.json({ vnpUrl }, { status: 200 });

  } catch (error: any) {
    console.error("[POST /api/vnpay/retry]", error);
    return NextResponse.json({ error: "Lỗi tạo link thanh toán" }, { status: 500 });
  }
}
