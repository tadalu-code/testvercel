import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const product = await prisma.product.findUnique({ where: { slug: id } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviews = await prisma.productReview.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          }
        }
      }
    });

    const formattedReviews = reviews.map(r => ({
      ...r,
      user: {
        name: r.user?.name || r.user?.email || "Khách hàng",
        avatar_url: r.user?.avatarUrl || null
      }
    }));

    return NextResponse.json({ data: formattedReviews });
  } catch (error: any) {
    console.error("[GET /api/products/[slug]/reviews]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const product = await prisma.product.findUnique({ where: { slug: id } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const { rating, content, imagesUrl } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    // Verify if user bought this product and order is COMPLETED
    const boughtItems = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          userId: user.id,
          status: "COMPLETED"
        }
      }
    });

    if (!boughtItems) {
      return NextResponse.json({ error: "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành công." }, { status: 403 });
    }

    // Optional: limit to 1 review per user per product
    const existingReview = await prisma.productReview.findFirst({
      where: { productId: product.id, userId: user.id }
    });

    if (existingReview) {
      return NextResponse.json({ error: "Bạn đã đánh giá sản phẩm này rồi." }, { status: 400 });
    }

    const newReview = await prisma.productReview.create({
      data: {
        userId: user.id,
        productId: product.id,
        rating,
        content: content || "",
        imagesUrl: imagesUrl || []
      }
    });

    return NextResponse.json({ data: newReview }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/products/[slug]/reviews]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
