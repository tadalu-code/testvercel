import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, items:order_items(*, product:products(*))")
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    console.error("[GET /api/orders/[id]]", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, cancelReason } = body;

    if (!status) {
      return NextResponse.json({ error: "Thiếu status" }, { status: 400 });
    }

    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select("status, items:order_items(productId, quantity)")
      .eq("id", id)
      .single();

    if (!existingOrder) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    const updateData: any = { status, updatedAt: new Date().toISOString() };
    if (cancelReason !== undefined) {
      updateData.cancelReason = cancelReason;
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Lỗi cập nhật hoặc không tìm thấy" }, { status: 500 });
    }

    // Phục hồi tồn kho nếu đơn hàng bị huỷ
    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED" && existingOrder.items) {
      for (const item of existingOrder.items) {
        const { data: p } = await supabaseAdmin.from("products").select("stock").eq("id", item.productId).single();
        if (p) {
          await supabaseAdmin
            .from("products")
            .update({ stock: p.stock + item.quantity })
            .eq("id", item.productId);
        }
      }
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    console.error("[PATCH /api/orders/[id]]", error);
    return NextResponse.json({ error: "Lỗi cập nhật đơn hàng" }, { status: 500 });
  }
}
