import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    const { data: category, error } = await supabaseAdmin
      .from("categories")
      .select("*, products(count)")
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();

    if (error || !category) {
      return NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 });
    }

    // Format count
    const _count = { products: category.products ? category.products[0]?.count || 0 : 0 };
    delete category.products;

    return NextResponse.json({ data: { ...category, _count } });
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

    const { data: category, error } = await supabaseAdmin
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
      }
      throw error;
    }

    if (!category) {
       return NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 });
    }

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error("[PUT /api/categories/[id]]", error);
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
    
    if (error) throw error;
    
    return NextResponse.json({ message: "Đã xoá danh mục" });
  } catch (error) {
    console.error("[DELETE /api/categories/[id]]", error);
    return NextResponse.json({ error: "Lỗi xoá danh mục" }, { status: 500 });
  }
}
