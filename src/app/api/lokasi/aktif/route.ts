import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nama: true,
        latitude: true,
        longitude: true,
        radius: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Get active locations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
