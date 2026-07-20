import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session nếu đã hết hạn — QUAN TRỌNG: không xoá dòng này
  const { data: { user } } = await supabase.auth.getUser();

  // Lấy danh sách email được phép làm admin từ biến môi trường
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());

  // Bảo vệ route /admin — redirect về /auth/login nếu chưa đăng nhập
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = request.nextUrl.pathname === "/auth/login";

  if (isAdminRoute) {
    if (!user) {
      // Chưa đăng nhập -> về trang login
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      return NextResponse.redirect(loginUrl);
    }
    
    // Đã đăng nhập, kiểm tra xem email có nằm trong danh sách admin không
    const userEmail = user.email?.toLowerCase() || "";
    if (!adminEmails.includes(userEmail)) {
      // Không phải admin -> về trang chủ
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }
  }

  // Nếu đã login mà vào lại trang login → redirect về trang chủ
  if (isLoginPage && user) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
};
