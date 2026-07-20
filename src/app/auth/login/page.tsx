"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/admin`,
      },
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    
    // Nếu người dùng nhập số điện thoại hoặc tên đăng nhập (không chứa @)
    // Ta tự động thêm đuôi @nongduoc.vn để hợp lệ với Supabase Auth
    const authEmail = email.includes("@") ? email : `${email}@nongduoc.vn`;

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (authError) {
      setError("Email hoặc mật khẩu không hợp lệ");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">


      {/* Main Body with Green Background (Replaces Shopee's Orange) */}
      <div className="bg-[#028046] flex-grow flex items-center">
        <div className="max-w-[1040px] mx-auto w-full px-4 flex items-center justify-between py-12 lg:py-16">
          
          {/* Left side: Banner / Graphic */}
          <div className="hidden lg:flex w-full justify-center flex-col items-center text-white">
            <Link href="/">
              <img 
                src="https://nongduocmiennam.vn/logo512.png" 
                className="w-[300px] object-contain brightness-0 invert opacity-20 hover:opacity-40 transition-opacity" 
                alt="Banner" 
              />
            </Link>
            <h2 className="text-3xl font-bold mt-8 text-center text-white/90">
              Chất lượng tạo niềm tin
            </h2>
            <p className="text-lg text-white/70 mt-2 text-center">
              Nông Dược Miền Nam đồng hành cùng nhà nông
            </p>
          </div>

          {/* Right side: Login Box */}
          <div className="w-full lg:w-[400px] shrink-0 bg-white rounded-[4px] shadow-lg p-[30px] mx-auto lg:mx-0">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[20px] text-[#222] font-medium">Đăng nhập</h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-600 text-[14px] flex items-center gap-2">
                <span className="text-red-500">⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <input
                  id="admin-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email/Số điện thoại/Tên đăng nhập"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:border-[#028046] text-[14px] transition-colors placeholder:text-gray-400"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:border-[#028046] text-[14px] transition-colors placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#028046] text-white text-[14px] font-medium py-3 rounded-sm hover:bg-[#026c3b] transition-colors uppercase disabled:opacity-70 mt-2"
              >
                {loading ? "Đang xử lý..." : "Đăng Nhập"}
              </button>
              
              <div className="flex justify-between items-center text-[12px] text-blue-600 mt-3">
                <Link href="#" className="hover:text-blue-700">Quên mật khẩu</Link>
                <Link href="#" className="hover:text-blue-700">Đăng nhập với SMS</Link>
              </div>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-1 h-[1px] bg-gray-200"></div>
              <span className="px-4 text-[12px] text-gray-400 uppercase">Hoặc</span>
              <div className="flex-1 h-[1px] bg-gray-200"></div>
            </div>

            <div className="flex gap-2 mb-6">
              <button className="flex-1 border border-gray-300 py-2 rounded-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="FB" className="w-5 h-5" />
                <span className="text-[14px] text-gray-700">Facebook</span>
              </button>
              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="flex-1 border border-gray-300 py-2 rounded-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
                <span className="text-[14px] text-gray-700">Google</span>
              </button>
            </div>

            <div className="text-center text-[14px] text-gray-500">
              Bạn mới biết đến Nông Dược Miền Nam?{" "}
              <Link href="/auth/register" className="text-[#028046] font-medium hover:underline">
                Đăng ký
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
