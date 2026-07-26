"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, FileText, Tag, MessageSquare, TrendingUp, Download, ShoppingBag, DollarSign, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from "xlsx";

interface Stats {
  totalProducts: number;
  totalPosts: number;
  totalCategories: number;
  totalContacts: number;
  unreadContacts: number;
  pendingOrders: number;
}

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  revenueChart: { date: string; revenue: number }[];
  topCustomers: { email: string; name: string; totalSpent: number; totalOrders: number }[];
  topProducts: { id: string; name: string; quantitySold: number; revenue: number }[];
  statusDistribution: { name: string; value: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#eab308", 
  CONFIRMED: "#3b82f6", 
  SHIPPING: "#a855f7", 
  DELIVERED: "#14b8a6", 
  COMPLETED: "#22c55e", 
  CANCELLED: "#ef4444", 
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const [daysFilter, setDaysFilter] = useState("30");

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then((res) => {
      setStats(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?days=${daysFilter}`).then((r) => r.json()).then((res) => {
      setAnalytics(res.data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [daysFilter]);

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
    { label: "Đơn hàng mới", value: stats?.pendingOrders ?? 0, icon: ShoppingBag, color: "from-orange-500 to-orange-600", bg: "bg-orange-50", href: "/admin/orders" },
    { label: "Liên hệ mới", value: stats?.unreadContacts ?? 0, icon: MessageSquare, color: "from-green-500 to-emerald-600", bg: "bg-green-50", href: "/admin/contacts" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Tổng quan hệ thống & Báo cáo doanh thu</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={daysFilter} 
            onChange={(e) => setDaysFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="7">7 ngày qua</option>
            <option value="30">30 ngày qua</option>
            <option value="365">1 năm qua</option>
          </select>
          <button
            onClick={exportRevenue}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={16} /> Xuất Excel
          </button>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#028046] to-emerald-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <DollarSign size={80} />
          </div>
          <p className="text-emerald-100 font-medium mb-1">Tổng doanh thu ({daysFilter} ngày)</p>
          {loading ? (
            <div className="h-10 w-40 bg-white/20 rounded animate-pulse" />
          ) : (
            <h3 className="text-4xl font-bold tracking-tight">{formatCurrency(analytics?.totalRevenue || 0)}</h3>
          )}
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <CheckCircle size={80} />
          </div>
          <p className="text-blue-100 font-medium mb-1">Đơn hàng thành công ({daysFilter} ngày)</p>
          {loading ? (
            <div className="h-10 w-24 bg-white/20 rounded animate-pulse" />
          ) : (
            <h3 className="text-4xl font-bold tracking-tight">{analytics?.totalOrders || 0} đơn</h3>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">Biểu đồ doanh thu</h2>
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
                  <RechartsTooltip 
                    formatter={(value: any) => formatCurrency(value || 0)}
                    labelStyle={{ color: '#333', fontWeight: 'bold' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="revenue" fill="#028046" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status PieChart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Tỷ lệ trạng thái đơn hàng</h2>
          <div className="h-[300px] w-full flex items-center justify-center">
            {loading ? (
              <div className="w-48 h-48 bg-gray-50 rounded-full animate-pulse" />
            ) : !analytics?.statusDistribution?.length ? (
              <p className="text-gray-400">Chưa có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any, name: string) => [value + " đơn", STATUS_LABELS[name] || name]}
                  />
                  <Legend 
                    formatter={(value) => STATUS_LABELS[value] || value} 
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
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
