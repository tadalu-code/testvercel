import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json(); // action = "APPROVE" or "REJECT"

    const resolvedParams = await params;
    const order = await prisma.order.findUnique({ where: { id: resolvedParams.id } });
    
    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    if (action === "APPROVE") {
      await prisma.order.update({
        where: { id: resolvedParams.id },
        data: {
          status: "CANCELLED",
          isCancelRequested: false
        }
      });
    } else if (action === "REJECT") {
      await prisma.order.update({
        where: { id: resolvedParams.id },
        data: {
          isCancelRequested: false
          // Keep the cancelReason so we have history, or clear it. Let's keep it but it won't show as a request.
        }
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
