import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      },
      include: {
        category: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("[GET /api/products/[id]]", error);
    return NextResponse.json({ error: "Lỗi Server" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, slug, description, imagesUrl, categoryId, isPublished, price, salePrice, stock, unit, technicalSpecs, metaTitle, metaDescription, metaKeywords } = body;

    // Lấy thông tin sản phẩm hiện tại để kiểm tra tồn kho
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { stock: true }
    });

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || "",
        technicalSpecs: technicalSpecs || null,
        imagesUrl: imagesUrl || [],
        categoryId: categoryId || null,
        isPublished: isPublished ?? true,
        price: price ?? null,
        salePrice: salePrice ?? null,
        stock: stock ?? 0,
        unit: unit || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || null,
      },
      include: {
        category: true
      }
    });

    // Nếu trước đó hết hàng (stock = 0) và bây giờ có hàng (stock > 0)
    if (existingProduct?.stock === 0 && (stock ?? 0) > 0) {
      // Tìm tất cả user đã yêu thích sản phẩm này
      const wishlists = await prisma.wishlist.findMany({
        where: { productId: id },
        select: { userId: true }
      });

      if (wishlists.length > 0) {
        const catSlug = product.category?.slug || "tat-ca";
        await prisma.notification.createMany({
          data: wishlists.map(w => ({
            userId: w.userId,
            title: "Sản phẩm yêu thích đã có hàng! 📦",
            message: `Sản phẩm "${product.name}" mà bạn yêu thích đã có hàng trở lại. Nhanh tay đặt mua nhé!`,
            type: "STOCK_UPDATE",
            linkUrl: `/san-pham/${catSlug}/${product.slug}`
          }))
        });
      }
    }

    return NextResponse.json({ data: product });
  } catch (error: any) {
    console.error("[PUT /api/products/[id]]", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    await prisma.product.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/products/[id]]", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }
    return NextResponse.json({ error: "Lỗi Server" }, { status: 500 });
  }
}
