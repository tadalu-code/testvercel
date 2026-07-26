import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyVNPayIPN } from "@/lib/vnpay";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const { isValid, orderId, responseCode, amount } = verifyVNPayIPN(searchParams);

    if (!isValid) {
      return NextResponse.json({ RspCode: '97', Message: 'Checksum failed' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ RspCode: '01', Message: 'Order not found' });
    }

    // Check amount
    if (order.totalAmount !== amount) {
      return NextResponse.json({ RspCode: '04', Message: 'Invalid amount' });
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    if (responseCode === '00') {
      // Payment success
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED'
        }
      });
    } else {
      // Payment failed
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'UNPAID'
        }
      });
    }

    return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error) {
    console.error("[VNPay IPN Error]", error);
    return NextResponse.json({ RspCode: '99', Message: 'Unknown error' });
  }
}
