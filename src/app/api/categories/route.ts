import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from("categories")
      .select("*, products(count)")
      .order("name", { ascending: true });

    if (error) throw error;

    const formattedCategories = categories?.map((cat: any) => ({
      ...cat,
      _count: {
        products: cat.products?.[0]?.count || 0
      },
      products: undefined // remove the raw products array
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error("[GET /api/categories] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description } = body;
    const crypto = require('crypto');
    const id = crypto.randomUUID();

    const { data: category, error } = await supabaseAdmin
      .from("categories")
      .insert([{ 
        id, 
        name, 
        slug, 
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/categories] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
