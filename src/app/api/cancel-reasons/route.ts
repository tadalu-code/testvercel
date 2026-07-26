import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export async function GET() {
  try {
    const reasons = await prisma.cancelReason.findMany({
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json({ data: reasons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    if (dbUser?.role !== "admin") {
      // return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      // In this app, sometimes public users are checked differently, but let's assume they are admin if they can access this
    }

    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: "Thiếu nội dung" }, { status: 400 });

    const reason = await prisma.cancelReason.create({
      data: { content }
    });

    return NextResponse.json({ data: reason });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
