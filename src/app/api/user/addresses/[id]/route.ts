import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { fullName, phone, province, commune, detail, isDefault } = body;

    // Verify ownership
    const existing = await prisma.userAddress.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    // If setting as default, update all other addresses to not default
    if (isDefault && !existing.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: userId },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await prisma.userAddress.update({
      where: { id },
      data: {
        fullName: fullName ?? existing.fullName,
        phone: phone ?? existing.phone,
        province: province ? JSON.stringify({ code: province.code, name: province.name }) : existing.province,
        commune: commune ? JSON.stringify({ code: commune.code, name: commune.name }) : existing.commune,
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = await prisma.userAddress.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    await prisma.userAddress.delete({
      where: { id }
    });

    // If we deleted the default address, make the newest remaining address the default
    if (existing.isDefault) {
      const remaining = await prisma.userAddress.findFirst({
        where: { userId: userId },
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
