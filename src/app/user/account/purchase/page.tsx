import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PurchaseTabs from "./PurchaseTabs";

export const metadata = {
  title: "Đơn Mua | Nông Dược Miền Nam",
};

export default async function PurchasePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch orders for the logged in user
  let orders = await prisma.order.findMany({
    where: { userId: (user as any).id },
    include: {
      items: {
        include: {
          product: {
            select: {
              imagesUrl: true,
              slug: true,
              category: { select: { slug: true } }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Lazy Cancellation Logic: Cancel unpaid VNPay orders older than 15 minutes
  const now = new Date();
  const FIFTEEN_MINUTES = 15 * 60 * 1000;
  
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    if (order.paymentMethod === "VNPAY" && order.paymentStatus === "UNPAID" && order.status === "PENDING") {
      const orderAge = now.getTime() - order.createdAt.getTime();
      if (orderAge > FIFTEEN_MINUTES) {
        // Cancel order and restore stock/coupons
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "CANCELLED",
              cancelReason: "Hệ thống tự động hủy do quá hạn thanh toán VNPay"
            }
          });

          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            });
          }

          if (order.couponCode) {
            await tx.coupon.update({
              where: { code: order.couponCode },
              data: { usageCount: { decrement: 1 } }
            });
          }
        });
        
        // Update the order in memory so UI reflects CANCELLED immediately
        orders[i].status = "CANCELLED";
        orders[i].cancelReason = "Hệ thống tự động hủy do quá hạn thanh toán VNPay";
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
      <PurchaseTabs orders={orders || []} />
    </div>
  );
}
