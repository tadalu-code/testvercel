import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 });
    }

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error("[GET /api/categories/[id]]", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, description } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;

    const category = await prisma.category.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ data: category });
  } catch (error: any) {
    console.error("[PUT /api/categories/[id]]", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 });
    }
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    await prisma.category.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: "Đã xoá danh mục" });
  } catch (error: any) {
    console.error("[DELETE /api/categories/[id]]", error);
    return NextResponse.json({ error: "Lỗi xoá danh mục" }, { status: 500 });
  }
}
