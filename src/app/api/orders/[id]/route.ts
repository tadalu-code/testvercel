import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    console.error("[GET /api/orders/[id]]", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, cancelReason, fullName, phone, address, note } = body;

    if (!status && !fullName && !phone && !address) {
      return NextResponse.json({ error: "Không có dữ liệu cập nhật" }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (cancelReason !== undefined) updateData.cancelReason = cancelReason;
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (note !== undefined) updateData.note = note;

    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData
      });

      // Restore stock if cancelled
      if (status === "CANCELLED" && existingOrder.status !== "CANCELLED" && existingOrder.items) {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      // Create notification if status changed and user exists
      if (status && status !== existingOrder.status && existingOrder.userId) {
        let statusText = status;
        switch (status) {
          case "PENDING": statusText = "Chờ xử lý"; break;
          case "PROCESSING": statusText = "Đang xử lý"; break;
          case "SHIPPING": statusText = "Đang giao hàng"; break;
          case "DELIVERED": statusText = "Đã giao hàng"; break;
          case "CANCELLED": statusText = "Đã hủy"; break;
        }

        await tx.notification.create({
          data: {
            userId: existingOrder.userId,
            title: "Cập nhật đơn hàng",
            message: `Đơn hàng #${existingOrder.id.slice(0,8)} của bạn đã chuyển sang trạng thái: ${statusText}.`,
            type: "ORDER_STATUS",
            linkUrl: "/user/account/purchase",
          }
        });
      }

      return updatedOrder;
    });

    return NextResponse.json({ data: order });
  } catch (error) {
    console.error("[PATCH /api/orders/[id]]", error);
    return NextResponse.json({ error: "Lỗi cập nhật đơn hàng" }, { status: 500 });
  }
}
