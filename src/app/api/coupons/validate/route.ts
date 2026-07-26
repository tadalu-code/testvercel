import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, cartTotal } = body;

    if (!code) {
      return NextResponse.json({ error: "Vui lòng nhập mã giảm giá" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Mã giảm giá không tồn tại" }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: "Mã giảm giá đã bị vô hiệu hóa" }, { status: 400 });
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return NextResponse.json({ error: "Mã giảm giá chưa đến thời gian áp dụng" }, { status: 400 });
    }
    if (coupon.endDate && now > coupon.endDate) {
      return NextResponse.json({ error: "Mã giảm giá đã hết hạn" }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Mã giảm giá đã hết lượt sử dụng" }, { status: 400 });
    }

    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      return NextResponse.json({ error: `Đơn hàng tối thiểu để áp dụng mã này là ${coupon.minOrderValue.toLocaleString("vi-VN")}đ` }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "FIXED") {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    }

    // Don't discount more than cart total
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discountAmount,
      }
    });

  } catch (error: any) {
    console.error("[POST /api/coupons/validate]", error);
    return NextResponse.json({ error: "Lỗi kiểm tra mã giảm giá" }, { status: 500 });
  }
}
