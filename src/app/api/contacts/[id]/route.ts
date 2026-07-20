import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isRead } = body;

    
    const { data: contact, error } = await supabaseAdmin
      .from("contacts")
      .update({ isRead, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: "Không tìm thấy liên hệ" }, { status: 404 });
    }

    return NextResponse.json({ data: contact });
  } catch (error) {
    console.error("[PUT /api/contacts/[id]]", error);
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}
