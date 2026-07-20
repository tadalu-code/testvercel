import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET: Lấy tất cả settings (public)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value");

    if (error) throw error;

    // Chuyển từ mảng [{key, value}] thành object {key: value} cho dễ dùng
    const settings: Record<string, string> = {};
    (data || []).forEach((row) => {
      settings[row.key] = row.value ?? "";
    });

    return NextResponse.json({ data: settings });
  } catch (error: any) {
    console.error("[GET /api/site-settings]", error);
    return NextResponse.json({ error: "Lỗi lấy cài đặt" }, { status: 500 });
  }
}

// PUT: Cập nhật nhiều settings cùng lúc (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // body là object {key: value, key2: value2, ...}
    const rows = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
      updatedAt: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PUT /api/site-settings]", error);
    return NextResponse.json({ error: "Lỗi lưu cài đặt" }, { status: 500 });
  }
}
