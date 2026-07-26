import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateVNPayUrl } from "@/lib/vnpay";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    const where = (status && status !== "ALL") ? { status: status as any } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.order.count({ where })
    ]);

    const userIds = [...new Set(orders.map((o: any) => o.userId).filter(Boolean))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds as string[] } },
      select: { id: true, name: true, email: true, phone: true }
    });

    const ordersWithUsers = orders.map((order: any) => {
      const account = users.find(u => u.id === order.userId);
      return {
        ...order,
        account: account || null
      };
    });

    return NextResponse.json({
      data: { orders: ordersWithUsers, total },
    });
  } catch (error) {
    console.error("[GET /api/orders]", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách đơn hàng" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, address, note, items, couponCode, discountAmount: clientDiscount, paymentMethod = "COD" } = body;

    if (!fullName || !phone || !address || !items || items.length === 0) {
      return NextResponse.json({ error: "Thiếu thông tin đơn hàng" }, { status: 400 });
    }

    const productIds = items.map((i: any) => i.productId).filter((id: any) => id != null);
    
    if (productIds.length === 0) {
      return NextResponse.json({ error: "Không có sản phẩm hợp lệ trong giỏ hàng" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    let totalAmount = 0;
    const orderItemsData = items.map((item: any) => {
      const product = products.find((p: any) => p.id === item.productId);
      if (!product) throw new Error(`Sản phẩm ${item.productId} không tồn tại`);

      if (product.stock < item.quantity) {
        throw new Error(`Sản phẩm "${product.name}" không đủ số lượng (còn ${product.stock})`);
      }

      const price = product.salePrice ?? product.price ?? 0;
      totalAmount += price * item.quantity;

      return {
        productId: product.id,
        name: product.name,
        price,
        quantity: item.quantity,
      };
    });

    const isCanTho = address.toLowerCase().includes("cần thơ") || address.toLowerCase().includes("can tho");
    const shippingFee = isCanTho ? 0 : 30000;
    
    let subTotalAmount = totalAmount; // Without shipping
    
    // Validate Coupon
    let actualDiscount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive) {
        let valid = true;
        const now = new Date();
        if (coupon.startDate && now < coupon.startDate) valid = false;
        if (coupon.endDate && now > coupon.endDate) valid = false;
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) valid = false;
        if (coupon.minOrderValue && subTotalAmount < coupon.minOrderValue) valid = false;

        if (valid) {
          if (coupon.discountType === "FIXED") {
            actualDiscount = coupon.discountValue;
          } else if (coupon.discountType === "PERCENTAGE") {
            actualDiscount = (subTotalAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && actualDiscount > coupon.maxDiscountAmount) {
              actualDiscount = coupon.maxDiscountAmount;
            }
          }
          if (actualDiscount > subTotalAmount) {
            actualDiscount = subTotalAmount;
          }
        }
      }
    }

    totalAmount = subTotalAmount - actualDiscount + shippingFee;
    if (totalAmount < 0) totalAmount = 0;

    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    // Run order creation and stock decrement in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          fullName,
          phone,
          address,
          note: note || null,
          totalAmount,
          couponCode: actualDiscount > 0 ? couponCode : null,
          discountAmount: actualDiscount,
          status: "PENDING",
          paymentMethod: paymentMethod === "VNPAY" ? "VNPAY" : "COD",
          paymentStatus: "UNPAID",
          items: {
            create: orderItemsData.map((item: any) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity
            }))
          }
        },
        include: {
          items: true
        }
      });

      // Decrement stock
      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity }
          }
        });
      }

      // Increment coupon usage
      if (actualDiscount > 0 && couponCode) {
        await tx.coupon.update({
          where: { code: couponCode },
          data: { usageCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    if (paymentMethod === "VNPAY") {
      const ipAddr = request.headers.get("x-forwarded-for") || "127.0.0.1";
      const orderInfo = `Thanh toan don hang ${order.id}`;
      const vnpUrl = generateVNPayUrl(ipAddr.split(',')[0], totalAmount, orderInfo, order.id);
      
      return NextResponse.json({ data: order, vnpUrl }, { status: 201 });
    }

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ error: error.message || "Lỗi tạo đơn hàng" }, { status: 500 });
  }
}
