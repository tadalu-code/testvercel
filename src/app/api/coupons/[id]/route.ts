import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    // Check if code is being updated and already exists
    if (body.code) {
      const existing = await prisma.coupon.findFirst({
        where: { 
          code: body.code.toUpperCase(),
          NOT: { id: resolvedParams.id }
        }
      });
      
      if (existing) {
        return NextResponse.json({ error: "Mã giảm giá đã tồn tại" }, { status: 400 });
      }
    }

    const dataToUpdate: any = {};
    if (body.code !== undefined) dataToUpdate.code = body.code.toUpperCase();
    if (body.discountType !== undefined) dataToUpdate.discountType = body.discountType;
    if (body.discountValue !== undefined) dataToUpdate.discountValue = Number(body.discountValue);
    if (body.minOrderValue !== undefined) dataToUpdate.minOrderValue = body.minOrderValue ? Number(body.minOrderValue) : null;
    if (body.maxDiscountAmount !== undefined) dataToUpdate.maxDiscountAmount = body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null;
    if (body.usageLimit !== undefined) dataToUpdate.usageLimit = body.usageLimit ? Number(body.usageLimit) : null;
    if (body.startDate !== undefined) dataToUpdate.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) dataToUpdate.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.isActive !== undefined) dataToUpdate.isActive = body.isActive;

    const coupon = await prisma.coupon.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ data: coupon });
  } catch (error: any) {
    console.error("[PATCH /api/coupons/[id]]", error);
    return NextResponse.json({ error: "Lỗi cập nhật mã giảm giá" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.coupon.delete({
      where: { id: resolvedParams.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/coupons/[id]]", error);
    return NextResponse.json({ error: "Lỗi xóa mã giảm giá" }, { status: 500 });
  }
}
