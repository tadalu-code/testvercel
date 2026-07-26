import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const { pathname } = req.nextUrl;
      
      // Yêu cầu đăng nhập cho trang admin
      if (pathname.startsWith("/admin")) {
        return !!token && (token.role === "admin" || token.role === "staff");
      }

      // Yêu cầu đăng nhập cho trang user/account
      if (pathname.startsWith("/user/account") || pathname.startsWith("/thanh-toan")) {
        return !!token;
      }

      return true; // Cho phép truy cập các trang khác
    },
  },
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/account/:path*",
    "/thanh-toan/:path*",
  ],
};
