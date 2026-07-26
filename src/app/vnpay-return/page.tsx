"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function VNPayReturnContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  
  useEffect(() => {
    const responseCode = searchParams.get("vnp_ResponseCode");
    if (responseCode) {
      // Gọi thủ công IPN route để đồng bộ trạng thái (đặc biệt hữu ích khi test local vì VNPay không thể gọi IPN tới localhost)
      fetch(`/api/vnpay/vnpay_ipn?${searchParams.toString()}`)
        .finally(() => {
          if (responseCode === "00") {
            setStatus("success");
          } else {
            setStatus("error");
          }
        });
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#f6f8f5] flex items-center justify-center">
        <div className="text-gray-500 animate-pulse font-medium">Đang kiểm tra giao dịch...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f5] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 max-w-lg w-full text-center">
        {status === "success" ? (
          <>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-[#028046]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Thanh toán thành công!</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Cảm ơn bạn đã mua sắm tại Nông Dược Miền Nam. Đơn hàng của bạn đã được thanh toán qua VNPay và đang được xử lý.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Giao dịch thất bại</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Thanh toán VNPay không thành công hoặc đã bị hủy. Vui lòng kiểm tra lại số dư hoặc thử hình thức thanh toán khác.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/user/account/purchase"
            className="flex-1 px-6 py-3.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            Quản lý đơn hàng
          </Link>
          <Link
            href="/"
            className="flex-1 px-6 py-3.5 bg-[#028046] text-white font-semibold rounded-xl hover:bg-[#016a38] transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VNPayReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f8f5] flex items-center justify-center">Đang kiểm tra giao dịch...</div>}>
      <VNPayReturnContent />
    </Suspense>
  );
}
