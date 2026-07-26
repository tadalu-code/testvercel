import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ isLiked: false }); // Not logged in -> not liked
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  try {
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    return NextResponse.json({ isLiked: !!existing });
  } catch (error: any) {
    console.error("GET wishlist/check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
