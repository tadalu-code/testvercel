import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json({ data: addresses });
  } catch (error: any) {
    console.error("[GET /api/user/addresses]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phone, province, commune, detail, isDefault } = body;

    if (!fullName || !phone || !province || !commune || !detail) {
      return NextResponse.json({ error: "Thiếu thông tin địa chỉ" }, { status: 400 });
    }

    // Check if this is the user's first address
    const existingCount = await prisma.userAddress.count({
      where: { userId: user.id }
    });

    const shouldBeDefault = existingCount === 0 || isDefault;

    // If setting as default, update all other addresses to not default
    if (shouldBeDefault && existingCount > 0) {
      await prisma.userAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.userAddress.create({
      data: {
        userId: user.id,
        fullName,
        phone,
        province: JSON.stringify(province),
        commune: JSON.stringify(commune),
        detail,
        isDefault: shouldBeDefault
      }
    });

    return NextResponse.json({ data: newAddress }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/user/addresses]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
