import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isRead } = body;

    const contact = await prisma.contact.update({
      where: { id },
      data: { isRead }
    });

    return NextResponse.json({ data: contact });
  } catch (error: any) {
    console.error("[PATCH /api/contacts/[id]]", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Không tìm thấy liên hệ" }, { status: 404 });
    }
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}
