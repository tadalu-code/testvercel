import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "32");
    const categorySlug = searchParams.get("categorySlugs") || "";
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;
    
    let query = supabaseAdmin
      .from("products")
      .select("*, category:categories(*)", { count: "exact" })
      .eq("isPublished", true)
      .order("createdAt", { ascending: false })
      .range(skip, skip + limit - 1);

    if (categorySlug && categorySlug !== "tat-ca") {
      // Find category first to get its ID, or filter by category relation
      query = query.eq("categories.slug", categorySlug);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: products, count: totalItems, error } = await query;

    if (error) throw error;

    // Supabase returns related objects as an array if not 1:1, but here it's 1:1 so it's an object or null, but we need to filter out products where category doesn't match if we filtered
    let finalProducts = products;
    if (categorySlug && categorySlug !== "tat-ca") {
       finalProducts = products?.filter(p => p.category !== null) || [];
    }

    return NextResponse.json({
      data: { products: finalProducts, totalItems: totalItems || 0, page, limit },
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

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .insert([{
        id: crypto.randomUUID(),
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
      }])
      .select("*, category:categories(*)")
      .single();

    if (error) {
      if (error.code === "23505") { // Unique violation
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/products]", error);
    return NextResponse.json({ error: "Lỗi tạo sản phẩm" }, { status: 500 });
  }
}
