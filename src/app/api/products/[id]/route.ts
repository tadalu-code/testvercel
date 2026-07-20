import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(*)')
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();

    if (error || !product) {
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

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({
        name,
        slug,
        description: description || "",
        specifications: technicalSpecs || null,
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
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("[PUT /api/products/[id]]", error);
    return NextResponse.json({ error: "Lỗi Server" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/products/[id]]", error);
    return NextResponse.json({ error: "Lỗi Server" }, { status: 500 });
  }
}
