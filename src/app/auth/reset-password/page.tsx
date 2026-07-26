"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">Đường dẫn không hợp lệ (thiếu mã khôi phục).</p>
        <Link href="/auth/login" className="text-[#028046] font-medium hover:underline">Về trang đăng nhập</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu phải từ 6 ký tự trở lên.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Có lỗi xảy ra.");
      }
    } catch (err) {
      setError("Lỗi kết nối.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-3xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đổi mật khẩu thành công!</h2>
        <p className="text-gray-600 mb-6">Bạn có thể sử dụng mật khẩu mới để đăng nhập hệ thống.</p>
        <Link href="/auth/login" className="inline-block px-6 py-3 bg-[#028046] text-white rounded-md font-medium hover:bg-[#026c3b] transition-colors shadow-sm">
          Đăng Nhập Ngay
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-sm text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
        <input
          type={showPass ? "text" : "password"}
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:border-[#028046] text-sm"
          placeholder="Nhập mật khẩu mới"
        />
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
        <input
          type={showPass ? "text" : "password"}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:border-[#028046] text-sm"
          placeholder="Xác nhận mật khẩu"
        />
        <button
          type="button"
          onClick={() => setShowPass(!showPass)}
          className="absolute right-3 top-[36px] text-gray-500 hover:text-gray-700"
        >
          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 text-sm font-medium text-white bg-[#028046] hover:bg-[#026c3b] rounded-sm transition-colors disabled:opacity-70 mt-4 uppercase shadow-sm"
      >
        {loading ? "Đang xử lý..." : "Lưu mật khẩu mới"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-[120px] h-[120px] bg-white rounded-full shadow-sm flex items-center justify-center p-2 mb-4">
            <img
              className="w-full h-full object-contain"
              src="https://nongduocmiennam.vn/logo512.png"
              alt="Logo"
            />
          </div>
        </div>
        <h2 className="text-center text-[24px] font-bold text-gray-900">
          Khôi Phục Mật Khẩu
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
          <Suspense fallback={<div className="text-center text-gray-500">Đang tải...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
