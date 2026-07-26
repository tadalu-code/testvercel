import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalProducts,
      totalPosts,
      totalCategories,
      totalContacts,
      unreadContacts,
      pendingOrders,
      recentContacts,
      topProducts,
    ] = await Promise.all([
      prisma.product.count({ where: { isPublished: true } }),
      prisma.post.count({ where: { isPublished: true } }),
      prisma.category.count(),
      prisma.contact.count(),
      prisma.contact.count({ where: { isRead: false } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.contact.findMany({
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { category: true }
      }),
    ]);

    return NextResponse.json({
      data: {
        totalProducts,
        totalPosts,
        totalCategories,
        totalContacts,
        unreadContacts,
        pendingOrders,
        recentContacts,
        recentProducts: topProducts,
      },
    });
  } catch (error) {
    console.error("[GET /api/stats]", error);
    return NextResponse.json({ error: "Lỗi lấy thống kê" }, { status: 500 });
  }
}
