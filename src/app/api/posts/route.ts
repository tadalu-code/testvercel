import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const isPublishedParam = searchParams.get("isPublished");
    const isPublished = isPublishedParam ? isPublishedParam === "true" : undefined;
    const topicSlug = searchParams.get("topicSlug");
    
    const skip = (page - 1) * limit;

    let query: any = supabaseAdmin
      .from("posts")
      .select("*, topic:topics!inner(*)", { count: "exact" })
      .order("createdAt", { ascending: false })
      .range(skip, skip + limit - 1);

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    if (topicSlug && topicSlug !== 'all') {
      query = query.eq("topic.slug", topicSlug);
    }

    if (isPublished !== undefined) {
      query = query.eq("isPublished", isPublished);
    }

    const { data: posts, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      data: { posts: posts || [], totalItems: count || 0, page, limit },
    });
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách bài viết" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, shortDescription, content, thumbnail, topicId, isPublished, metaTitle, metaDescription, metaKeywords } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Thiếu tiêu đề hoặc slug" }, { status: 400 });
    }

    const insertData: any = {
      title,
      slug,
      shortDescription,
      content,
      thumbnail,
      topicId: topicId || null,
      isPublished: isPublished ?? true,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaKeywords: metaKeywords || null,
    };

    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/posts]", error);
    return NextResponse.json({ error: "Lỗi tạo bài viết" }, { status: 500 });
  }
}
