import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    
    if (error) throw error;

    const mappedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || 'Khách',
      role: user.user_metadata?.role || 'user',
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at
    }));

    // Sort by role: admin -> staff -> user, then by creation date
    mappedUsers.sort((a, b) => {
      const roleWeight = { admin: 1, staff: 2, user: 3 } as any;
      if (roleWeight[a.role] !== roleWeight[b.role]) {
        return roleWeight[a.role] - roleWeight[b.role];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ data: mappedUsers });
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách người dùng" }, { status: 500 });
  }
}
