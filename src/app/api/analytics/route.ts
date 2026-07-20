import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    // 1. Lấy tất cả các đơn hàng không bị Huỷ
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*, items:order_items(*, product:products(*))")
      .neq("status", "CANCELLED")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    // 2. Tính toán doanh thu theo ngày (30 ngày gần nhất)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const revenueByDayMap: Record<string, number> = {};
    const topCustomersMap: Record<string, { email: string, name: string, totalSpent: number, totalOrders: number }> = {};
    const topProductsMap: Record<string, { id: string, name: string, quantitySold: number, revenue: number }> = {};

    (orders || []).forEach(order => {
      const orderDate = new Date(order.createdAt);
      
      // Doanh thu theo ngày (chỉ tính đơn hàng trong 30 ngày)
      if (orderDate >= thirtyDaysAgo) {
        const dateString = orderDate.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
        revenueByDayMap[dateString] = (revenueByDayMap[dateString] || 0) + order.totalAmount;
      }

      // Khách hàng mua nhiều nhất
      const customerKey = order.email;
      if (customerKey) {
        if (!topCustomersMap[customerKey]) {
          topCustomersMap[customerKey] = { email: order.email, name: order.fullName, totalSpent: 0, totalOrders: 0 };
        }
        topCustomersMap[customerKey].totalSpent += order.totalAmount;
        topCustomersMap[customerKey].totalOrders += 1;
      }

      // Sản phẩm bán chạy nhất
      if (order.items) {
        order.items.forEach((item: any) => {
          const productId = item.productId;
          if (!topProductsMap[productId]) {
            topProductsMap[productId] = { 
              id: productId, 
              name: item.name || (item.product ? item.product.name : 'Sản phẩm đã xoá'), 
              quantitySold: 0, 
              revenue: 0 
            };
          }
          topProductsMap[productId].quantitySold += item.quantity;
          topProductsMap[productId].revenue += (item.price * item.quantity);
        });
      }
    });

    // Format dữ liệu biểu đồ doanh thu (điền 0 cho những ngày không có đơn)
    const revenueChart = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
      revenueChart.push({
        date: dateString,
        revenue: revenueByDayMap[dateString] || 0
      });
    }

    // Sort Top Khách hàng
    const topCustomers = Object.values(topCustomersMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Sort Top Sản phẩm
    const topProducts = Object.values(topProductsMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    return NextResponse.json({
      data: {
        revenueChart,
        topCustomers,
        topProducts
      }
    });
  } catch (error) {
    console.error("[GET /api/analytics]", error);
    return NextResponse.json({ error: "Lỗi lấy dữ liệu thống kê" }, { status: 500 });
  }
}
