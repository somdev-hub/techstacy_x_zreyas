import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters long" },
      { status: 400 }
    );
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ name: { contains: query } }, { sic: { contains: query } }]
      },
      select: {
        id: true,
        name: true,
        email: true,
        sic: true
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
