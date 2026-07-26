import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get("take") || "5", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const sort = searchParams.get("sort") || "newest";

    let orderBy: any = { createdAt: "desc" };

    if (sort === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (sort === "most_likes") {
      orderBy = [
        { likes: "desc" },
        { createdAt: "desc" }
      ];
    }

    const [comments, count] = await Promise.all([
      prisma.comment.findMany({
        where: { postId: id },
        skip,
        take,
        orderBy
      }),
      prisma.comment.count({
        where: { postId: id }
      })
    ]);

    return NextResponse.json({ data: comments, total: count });
  } catch (error) {
    console.error("[GET /api/posts/[id]/comments]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, author, avatarUrl } = body;

    if (!content || !author) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        content,
        author,
        avatarUrl,
      }
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/posts/[id]/comments]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
