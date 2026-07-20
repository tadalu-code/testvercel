"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, FileText, Tag, MessageSquare, TrendingUp, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from "xlsx";

interface Stats {
  totalProducts: number;
  totalPosts: number;
  totalCategories: number;
  totalContacts: number;
  unreadContacts: number;
}

interface Analytics {
  revenueChart: { date: string; revenue: number }[];
  topCustomers: { email: string; name: string; totalSpent: number; totalOrders: number }[];
  topProducts: { id: string; name: string; quantitySold: number; revenue: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/analytics").then((r) => r.json())
    ]).then(([statsRes, analyticsRes]) => {
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const exportRevenue = () => {
    if (!analytics?.revenueChart) return;
    const worksheet = XLSX.utils.json_to_sheet(analytics.revenueChart.map(item => ({
      "Ngày": item.date,
      "Doanh thu (VNĐ)": item.revenue
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Doanh Thu");
    XLSX.writeFile(workbook, `Bao_Cao_Doanh_Thu.xlsx`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const cards = [
    { label: "Sản phẩm", value: stats?.totalProducts ?? 0, icon: Package, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", href: "/admin/products" },
    { label: "Bài viết", value: stats?.totalPosts ?? 0, icon: FileText, color: "from-purple-500 to-purple-600", bg: "bg-purple-50", href: "/admin/posts" },
    { label: "Danh mục", value: stats?.totalCategories ?? 0, icon: Tag, color: "from-orange-500 to-orange-600", bg: "bg-orange-50", href: "/admin/categories" },
    { label: "Liên hệ mới", value: stats?.unreadContacts ?? 0, icon: MessageSquare, color: "from-green-500 to-emerald-600", bg: "bg-green-50", href: "/admin/contacts" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Tổng quan hệ thống & Báo cáo doanh thu</p>
        </div>
        <button
          onClick={exportRevenue}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
        >
          <Download size={16} /> Xuất doanh thu (Excel)
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}>
                  <Icon className="text-white" size={18} />
                </div>
                <TrendingUp size={14} className="text-gray-300 group-hover:text-green-500 transition-colors" />
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Doanh thu 30 ngày qua</h2>
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="w-full h-full bg-gray-50 animate-pulse rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.revenueChart || []} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#333', fontWeight: 'bold' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">Top sản phẩm bán chạy</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
               Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-3 flex gap-3">
                  <div className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
                </div>
              ))
            ) : analytics?.topProducts?.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
            ) : (
              analytics?.topProducts?.map((p, i) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-bold text-sm w-4">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.name}</p>
                      <p className="text-xs text-gray-500">Đã bán: <span className="font-semibold">{p.quantitySold}</span></p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">Khách hàng chi tiêu nhiều nhất</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
               Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-3 flex gap-3">
                  <div className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
                </div>
              ))
            ) : analytics?.topCustomers?.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
            ) : (
              analytics?.topCustomers?.map((c, i) => (
                <div key={c.email} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-bold text-sm w-4">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.name || "Khách"}</p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(c.totalSpent)}</p>
                    <p className="text-xs text-gray-400">{c.totalOrders} đơn hàng</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
