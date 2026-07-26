import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const wishlists = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            salePrice: true,
            imagesUrl: true,
            stock: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ data: wishlists });
  } catch (error: any) {
    console.error("GET wishlist error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existing) {
      // Đã có -> Xóa (Bỏ thích)
      await prisma.wishlist.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ isLiked: false, message: "Removed from wishlist" });
    } else {
      // Chưa có -> Thêm (Thích)
      await prisma.wishlist.create({
        data: {
          userId,
          productId
        }
      });
      return NextResponse.json({ isLiked: true, message: "Added to wishlist" });
    }
  } catch (error: any) {
    console.error("POST wishlist error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
