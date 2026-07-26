import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId: postId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error("[GET /api/comments]", error);
    return NextResponse.json({ error: "Lỗi lấy bình luận" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, content, author, avatarUrl } = body;

    if (!postId || !content || !author) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        content,
        author,
        avatarUrl: avatarUrl || null
      }
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/comments]", error);
    return NextResponse.json({ error: "Lỗi đăng bình luận" }, { status: 500 });
  }
}
