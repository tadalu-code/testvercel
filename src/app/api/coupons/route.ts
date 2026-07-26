import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const coupons = await prisma.coupon.findMany({
      where: {
        code: {
          contains: search,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: coupons });
  } catch (error: any) {
    console.error("[GET /api/coupons]", error);
    return NextResponse.json({ error: "Lỗi lấy dữ liệu" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, discountType, discountValue, minOrderValue, maxDiscountAmount, startDate, endDate, usageLimit, isActive } = body;

    // Check if code exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });
    
    if (existing) {
      return NextResponse.json({ error: "Mã giảm giá đã tồn tại" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : null,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ data: coupon });
  } catch (error: any) {
    console.error("[POST /api/coupons]", error);
    return NextResponse.json({ error: "Lỗi tạo mã giảm giá" }, { status: 500 });
  }
}
