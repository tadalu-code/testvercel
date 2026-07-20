import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    
    const offset = (page - 1) * limit;
    const sb = supabaseAdmin;
    
    let query = sb
      .from("contacts")
      .select("*", { count: "exact" })
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: contacts, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      data: { contacts: contacts || [], totalItems: count || 0, page, limit },
    });
  } catch (error) {
    console.error("[GET /api/contacts]", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách liên hệ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !message) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const sb = supabaseAdmin;
    const { data: contact, error } = await sb
      .from("contacts")
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        subject: subject || null,
        message,
        isRead: false
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/contacts]", error);
    return NextResponse.json({ error: "Lỗi gửi liên hệ" }, { status: 500 });
  }
}

