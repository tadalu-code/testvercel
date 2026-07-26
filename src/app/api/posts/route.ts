import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const isPublishedParam = searchParams.get("isPublished");
    const isPublished = isPublishedParam ? isPublishedParam === "true" : undefined;
    const topicSlug = searchParams.get("topicSlug");
    
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {};

    if (search) {
      where.title = { contains: search };
    }

    if (topicSlug && topicSlug !== 'all') {
      where.topic = { slug: topicSlug };
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    const [posts, totalItems] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { topic: true }
      }),
      prisma.post.count({ where })
    ]);

    return NextResponse.json({
      data: { posts, totalItems, page, limit },
    });
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách bài viết" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, shortDescription, content, thumbnail, topicId, isPublished, metaTitle, metaDescription, metaKeywords } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Thiếu tiêu đề hoặc slug" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        shortDescription,
        content,
        thumbnail,
        topicId: topicId || null,
        isPublished: isPublished ?? true,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || null,
      }
    });

    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/posts]", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
    }
    return NextResponse.json({ error: "Lỗi tạo bài viết" }, { status: 500 });
  }
}
