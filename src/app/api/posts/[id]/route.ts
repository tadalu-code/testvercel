import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    // Tìm theo id hoặc slug
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .select("*, topic:topics(*)")
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error("[GET /api/posts/[id]]", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, shortDescription, content, thumbnail, topicId, isPublished, metaTitle, metaDescription, metaKeywords } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (content !== undefined) updateData.content = content;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (topicId !== undefined) updateData.topicId = topicId;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    updateData.metaTitle = metaTitle || null;
    updateData.metaDescription = metaDescription || null;
    updateData.metaKeywords = metaKeywords || null;
    updateData.updatedAt = new Date().toISOString();

    const { data: post, error } = await supabaseAdmin
      .from("posts")
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

    if (!post) {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }

    return NextResponse.json({ data: post });
  } catch (error: any) {
    console.error("[PUT /api/posts/[id]]", error);
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);
    if (error) throw error;
    
    return NextResponse.json({ message: "Đã xoá bài viết" });
  } catch (error) {
    console.error("[DELETE /api/posts/[id]]", error);
    return NextResponse.json({ error: "Lỗi xoá bài viết" }, { status: 500 });
  }
}
