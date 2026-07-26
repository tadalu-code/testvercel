import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: Prisma.TopicWhereInput = {};
    if (search) {
      where.name = { contains: search };
    }

    const topics = await prisma.topic.findMany({
      where,
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ data: { topics } });
  } catch (error) {
    console.error("[GET /api/topics]", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Thiếu name hoặc slug" }, { status: 400 });
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        slug,
        description: description || null
      }
    });

    return NextResponse.json({ data: topic }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/topics]", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
