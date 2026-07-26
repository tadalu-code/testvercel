import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";


// GET: Lấy tất cả settings (public)
export async function GET() {
  try {
    const data = await prisma.siteSetting.findMany({
      select: { key: true, value: true }
    });

    // Chuyển từ mảng [{key, value}] thành object {key: value} cho dễ dùng
    const settings: Record<string, string> = {};
    (data || []).forEach((row) => {
      settings[row.key] = row.value ?? "";
    });

    return NextResponse.json({ data: settings });
  } catch (error: any) {
    console.error("[GET /api/site-settings]", error);
    return NextResponse.json({ error: "Lỗi lấy cài đặt" }, { status: 500 });
  }
}

// PUT: Cập nhật nhiều settings cùng lúc (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // body là object {key: value, key2: value2, ...}
    
    // Prisma does not have a direct upsertMany, so we use a transaction
    const operations = Object.entries(body).map(([key, value]) => {
      return prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    });

    await prisma.$transaction(operations);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PUT /api/site-settings]", error);
    return NextResponse.json({ error: "Lỗi lưu cài đặt" }, { status: 500 });
  }
}
