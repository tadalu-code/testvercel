import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const isReadParam = searchParams.get("isRead");
    
    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = {};

    if (isReadParam !== null) {
      where.isRead = isReadParam === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    const [contacts, totalItems] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.contact.count({ where })
    ]);

    return NextResponse.json({
      data: { contacts, totalItems, page, limit },
    });
  } catch (error) {
    console.error("[GET /api/contacts]", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách liên hệ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, content, productName } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Vui lòng nhập tên và số điện thoại" }, { status: 400 });
    }

    // Rate Limiting (5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentContact = await prisma.contact.findFirst({
      where: {
        OR: [
          { phone: phone },
          ...(email ? [{ email: email }] : [])
        ],
        createdAt: { gte: fiveMinutesAgo }
      }
    });

    if (recentContact) {
      return NextResponse.json({ error: "Bạn thao tác quá nhanh, vui lòng thử lại sau 5 phút." }, { status: 429 });
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        content: content || null,
        productName: productName || null,
        isRead: false
      }
    });

    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/contacts]", error);
    return NextResponse.json({ error: "Lỗi gửi liên hệ" }, { status: 500 });
  }
}
