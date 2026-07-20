import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { fullName, phone, province, commune, detail, isDefault } = body;

    // Verify ownership
    const existing = await prisma.userAddress.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    // If setting as default, update all other addresses to not default
    if (isDefault && !existing.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await prisma.userAddress.update({
      where: { id },
      data: {
        fullName: fullName ?? existing.fullName,
        phone: phone ?? existing.phone,
        province: province ? JSON.stringify(province) : existing.province,
        commune: commune ? JSON.stringify(commune) : existing.commune,
        detail: detail ?? existing.detail,
        isDefault: isDefault ?? existing.isDefault
      }
    });

    return NextResponse.json({ data: updatedAddress });
  } catch (error: any) {
    console.error("[PUT /api/user/addresses/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const existing = await prisma.userAddress.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    await prisma.userAddress.delete({
      where: { id }
    });

    // If we deleted the default address, make the newest remaining address the default
    if (existing.isDefault) {
      const remaining = await prisma.userAddress.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
      });

      if (remaining) {
        await prisma.userAddress.update({
          where: { id: remaining.id },
          data: { isDefault: true }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/user/addresses/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
