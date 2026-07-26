import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[GET /api/categories] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description } = body;

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/categories] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
