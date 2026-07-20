import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let query = supabaseAdmin.from("topics").select("*").order("name", { ascending: true });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: topics, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: { topics } });
  } catch (error) {
    console.error("[GET /api/topics]", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Thiếu name hoặc slug" }, { status: 400 });
    }

    const { data: topic, error } = await supabaseAdmin
      .from("topics")
      .insert([{ name, slug, description }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ data: topic }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/topics]", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
