import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const [
      { count: totalProducts },
      { count: totalPosts },
      { count: totalCategories },
      { count: totalContacts },
      { count: unreadContacts },
      { data: recentContacts },
      { data: topProducts },
    ] = await Promise.all([
      supabaseAdmin.from("products").select("*", { count: "exact", head: true }).eq("isPublished", true),
      supabaseAdmin.from("posts").select("*", { count: "exact", head: true }).eq("isPublished", true),
      supabaseAdmin.from("categories").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("contacts").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("contacts").select("*", { count: "exact", head: true }).eq("isRead", false),
      supabaseAdmin.from("contacts").select("*").order("createdAt", { ascending: false }).limit(5),
      supabaseAdmin.from("products").select("*, category:categories(*)").order("createdAt", { ascending: false }).limit(5),
    ]);

    return NextResponse.json({
      data: {
        totalProducts: totalProducts || 0,
        totalPosts: totalPosts || 0,
        totalCategories: totalCategories || 0,
        totalContacts: totalContacts || 0,
        unreadContacts: unreadContacts || 0,
        recentContacts: recentContacts || [],
        recentProducts: topProducts || [],
      },
    });
  } catch (error) {
    console.error("[GET /api/stats]", error);
    return NextResponse.json({ error: "Lỗi lấy thống kê" }, { status: 500 });
  }
}
