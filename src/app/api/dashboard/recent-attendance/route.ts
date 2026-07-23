import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWIBRange } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { startOfDay, endOfDay } = getWIBRange();

    const attendances = await prisma.attendance.findMany({
      where: {
        tanggal: { gte: startOfDay, lt: endOfDay },
      },
      include: {
        user: {
          select: { nama: true, nomorInduk: true },
        },
      },
      orderBy: { checkIn: "desc" },
      take: 10,
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error("Recent attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
