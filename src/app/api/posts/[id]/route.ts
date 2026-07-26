import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    const post = await prisma.post.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      },
      include: {
        topic: true
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error("[GET /api/posts/[id]]", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, shortDescription, content, thumbnail, topicId, isPublished, metaTitle, metaDescription, metaKeywords } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (content !== undefined) updateData.content = content;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (topicId !== undefined) updateData.topicId = topicId;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    updateData.metaTitle = metaTitle || null;
    updateData.metaDescription = metaDescription || null;
    updateData.metaKeywords = metaKeywords || null;

    const post = await prisma.post.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ data: post });
  } catch (error: any) {
    console.error("[PUT /api/posts/[id]]", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    await prisma.post.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: "Đã xoá bài viết" });
  } catch (error: any) {
    console.error("[DELETE /api/posts/[id]]", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }
    return NextResponse.json({ error: "Lỗi xoá bài viết" }, { status: 500 });
  }
}
