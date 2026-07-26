import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "32");
    const categorySlug = searchParams.get("categorySlugs") || "";
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;
    
    const where: Prisma.ProductWhereInput = {
      isPublished: true,
    };

    if (categorySlug && categorySlug !== "tat-ca") {
      where.category = {
        slug: categorySlug
      };
    }

    if (search) {
      where.name = {
        contains: search
      };
    }

    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          category: true
        }
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      data: { products, totalItems, page, limit },
    });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách sản phẩm" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, imagesUrl, categoryId, isPublished, price, salePrice, stock, unit, technicalSpecs, metaTitle, metaDescription, metaKeywords } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Thiếu tên hoặc slug" }, { status: 400 });
    }

    const product = await prisma.product.create({
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

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/products]", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
    }
    return NextResponse.json({ error: "Lỗi tạo sản phẩm" }, { status: 500 });
  }
}
