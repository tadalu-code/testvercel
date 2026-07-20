import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PurchaseTabs from "./PurchaseTabs";

export const metadata = {
  title: "Đơn Mua | Nông Dược Miền Nam",
};

export default async function PurchasePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch orders for the logged in user
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select(`
      *,
      items:order_items(
        *,
        product:products(
          imagesUrl,
          slug
        )
      )
    `)
    .eq("userId", user.id)
    .order("createdAt", { ascending: false });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
      <PurchaseTabs orders={orders || []} />
    </div>
  );
}
