import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string; commentId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { commentId } = await params;

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        likes: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ data: updatedComment });
  } catch (error: any) {
    console.error("[PATCH /api/posts/[id]/comments/[commentId]/like]", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
