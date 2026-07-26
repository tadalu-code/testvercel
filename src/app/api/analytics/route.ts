import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30", 10);
    
    // Fetch all orders to get accurate status distribution
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const userIds = Array.from(new Set(orders.map(o => o.userId).filter(Boolean))) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - days);
    
    const revenueByDayMap: Record<string, number> = {};
    const topCustomersMap: Record<string, { email: string, name: string, totalSpent: number, totalOrders: number }> = {};
    const topProductsMap: Record<string, { id: string, name: string, quantitySold: number, revenue: number }> = {};
    
    const statusDistributionMap: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      SHIPPING: 0,
      DELIVERED: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };

    let totalRevenue = 0;
    let totalOrders = 0;

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      
      // Only process orders within the selected time range
      if (orderDate >= filterDate) {
        statusDistributionMap[order.status] = (statusDistributionMap[order.status] || 0) + 1;
        totalOrders += 1;
        
        // Only count revenue for successful/active orders
        if (order.status !== 'CANCELLED') {
          totalRevenue += order.totalAmount;
          
          const dateString = orderDate.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
          revenueByDayMap[dateString] = (revenueByDayMap[dateString] || 0) + order.totalAmount;

          const customerKey = order.userId || order.fullName;
          if (customerKey) {
            let displayName = order.fullName;
            let displayEmail = order.userId ? "ID: " + order.userId : "Khách vãng lai";

            if (order.userId) {
              const user = userMap.get(order.userId);
              if (user) {
                displayName = user.name || displayName;
                displayEmail = user.email || displayEmail;
              }
            }

            if (!topCustomersMap[customerKey]) {
              topCustomersMap[customerKey] = { email: displayEmail, name: displayName, totalSpent: 0, totalOrders: 0 };
            }
            topCustomersMap[customerKey].totalSpent += order.totalAmount;
            topCustomersMap[customerKey].totalOrders += 1;
          }

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
        }
      }
    });

    const revenueChart = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
      revenueChart.push({
        date: dateString,
        revenue: revenueByDayMap[dateString] || 0
      });
    }

    const topCustomers = Object.values(topCustomersMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const topProducts = Object.values(topProductsMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);
      
    // Format status distribution for PieChart
    const statusDistribution = Object.entries(statusDistributionMap)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({ name: status, value: count }));

    return NextResponse.json({
      data: {
        totalRevenue,
        totalOrders,
        revenueChart,
        topCustomers,
        topProducts,
        statusDistribution
      }
    });
  } catch (error) {
    console.error("[GET /api/analytics]", error);
    return NextResponse.json({ error: "Lỗi lấy dữ liệu thống kê" }, { status: 500 });
  }
}
