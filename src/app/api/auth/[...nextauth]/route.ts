import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          avatarUrl: profile.picture,
          role: "user", // Mặc định role là user
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        recaptchaToken: { label: "RecaptchaToken", type: "text" },
        recaptchaTokenV2: { label: "RecaptchaTokenV2", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vui lòng nhập email và mật khẩu");
        }

        // Lớp 1: Xác thực reCAPTCHA v3 (Chạy ngầm)
        if (credentials.recaptchaToken) {
          const secretKey = process.env.RECAPTCHA_SECRET_KEY;
          const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${credentials.recaptchaToken}`;
          
          const recaptchaRes = await fetch(verifyUrl, { method: "POST" });
          const recaptchaData = await recaptchaRes.json();
          
          if (!recaptchaData.success || recaptchaData.score < 0.5) {
            throw new Error("Phát hiện spam đăng nhập, vui lòng thử lại.");
          }
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.email },
              { phone: credentials.email },
              { username: credentials.email }
            ]
          }
        });

        if (!user) {
          throw new Error("Sai tên đăng nhập hoặc mật khẩu");
        }

        // Lớp 2: Kiểm tra nếu đã sai 3 lần thì BẮT BUỘC phải có Token v2
        if ((user.failedLoginAttempts || 0) >= 3) {
          if (!credentials.recaptchaTokenV2) {
            throw new Error("REQUIRE_V2_CAPTCHA");
          }
          
          // Xác thực reCAPTCHA v2
          const secretKeyV2 = process.env.RECAPTCHA_V2_SECRET_KEY;
          const verifyUrlV2 = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKeyV2}&response=${credentials.recaptchaTokenV2}`;
          
          const recaptchaResV2 = await fetch(verifyUrlV2, { method: "POST" });
          const recaptchaDataV2 = await recaptchaResV2.json();
          
          if (!recaptchaDataV2.success) {
            throw new Error("Xác thực Captcha không thành công, vui lòng thử lại.");
          }
        }

        if (!user.password) {
          throw new Error("Tài khoản này được đăng ký bằng Google. Vui lòng chọn Đăng nhập bằng Google.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          const newFailedCount = (user.failedLoginAttempts || 0) + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: newFailedCount }
          });
          
          if (newFailedCount >= 3) {
            throw new Error("REQUIRE_V2_CAPTCHA"); // Lập tức yêu cầu v2 nếu vừa đạt 3 lần
          } else {
            throw new Error(`Sai tên đăng nhập hoặc mật khẩu`);
          }
        }

        // Nếu đúng mật khẩu thì reset biến đếm
        if ((user.failedLoginAttempts || 0) > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0 }
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          username: user.username,
          phone: user.phone,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.avatarUrl = (user as any).avatarUrl || (user as any).image;
        token.username = (user as any).username;
        token.phone = (user as any).phone;
      }
      if (trigger === "update" && session) {
        if (session.avatarUrl) token.avatarUrl = session.avatarUrl;
        if (session.image) token.avatarUrl = session.image;
        if (session.name) token.name = session.name;
        if (session.username) token.username = session.username;
        if (session.phone) token.phone = session.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role;
        (session.user as any).image = token.avatarUrl; // Navbar.tsx reads user?.image
        (session.user as any).avatarUrl = token.avatarUrl;
        (session.user as any).username = token.username;
        (session.user as any).phone = token.phone;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
