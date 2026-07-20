import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    let query = supabaseAdmin
      .from("orders")
      .select(`
        *,
        items:order_items(
          *,
          product:products(*)
        )
      `, { count: "exact" })
      .order("createdAt", { ascending: false });

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data: orders, count: total, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: { orders: orders || [], total: total || 0 },
    });
  } catch (error) {
    console.error("[GET /api/orders]", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách đơn hàng" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, address, note, items } = body;

    if (!fullName || !phone || !address || !items || items.length === 0) {
      return NextResponse.json({ error: "Thiếu thông tin đơn hàng" }, { status: 400 });
    }

    const productIds = items.map((i: any) => i.productId).filter((id: any) => id != null);
    
    if (productIds.length === 0) {
      return NextResponse.json({ error: "Không có sản phẩm hợp lệ trong giỏ hàng" }, { status: 400 });
    }

    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .in("id", productIds);

    if (productError || !products || products.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    let totalAmount = 0;
    const orderItemsData = items.map((item: any) => {
      const product = products.find((p: any) => p.id === item.productId);
      if (!product) throw new Error(`Sản phẩm ${item.productId} không tồn tại`);

      if (product.stock < item.quantity) {
        throw new Error(`Sản phẩm "${product.name}" không đủ số lượng (còn ${product.stock})`);
      }

      const price = product.salePrice ?? product.price ?? 0;
      totalAmount += price * item.quantity;

      return {
        productId: product.id,
        name: product.name,
        price,
        quantity: item.quantity,
      };
    });

    const isCanTho = address.toLowerCase().includes("cần thơ") || address.toLowerCase().includes("can tho");
    const shippingFee = isCanTho ? 0 : 30000;
    totalAmount += shippingFee;

    const { createClient } = require("@/utils/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user ? user.id : null;

    const orderId = crypto.randomUUID();

    // Tạo đơn hàng
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        id: orderId,
        userId: userId,
        fullName,
        phone,
        address,
        note: note || null,
        totalAmount,
        status: "PENDING",
        paymentMethod: "COD",
        paymentStatus: "UNPAID",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Tạo chi tiết đơn hàng
    const itemsToInsert = orderItemsData.map(item => ({
      id: crypto.randomUUID(),
      orderId: orderId,
      ...item
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // Revert if items failed
      await supabaseAdmin.from("orders").delete().eq("id", orderId);
      throw itemsError;
    }

    // Trừ tồn kho bằng RPC (Database Function) để tránh lỗi xung đột (Race Condition)
    for (const item of orderItemsData) {
      const { error: rpcError } = await supabaseAdmin.rpc("decrement_stock", {
        p_id: item.productId,
        p_quantity: item.quantity,
      });

      if (rpcError) {
        // Hoàn tác nếu trừ kho thất bại (hết hàng do race condition)
        await supabaseAdmin.from("orders").delete().eq("id", orderId);
        throw new Error(rpcError.message || `Lỗi trừ tồn kho sản phẩm ${item.productId}`);
      }
    }

    // Fetch full order to return
    const { data: fullOrder } = await supabaseAdmin
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", orderId)
      .single();

    return NextResponse.json({ data: fullOrder }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ error: error.message || "Lỗi tạo đơn hàng" }, { status: 500 });
  }
}
