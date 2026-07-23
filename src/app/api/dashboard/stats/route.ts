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

    const totalKaryawan = await prisma.user.count({
      where: { isActive: true },
    });

    const hadirHariIni = await prisma.attendance.count({
      where: {
        tanggal: { gte: startOfDay, lt: endOfDay },
        status: "HADIR",
      },
    });

    const terlambatHariIni = await prisma.attendance.count({
      where: {
        tanggal: { gte: startOfDay, lt: endOfDay },
        status: "TERLAMBAT",
      },
    });

    const cutiPending = await prisma.leaveRequest.count({
      where: { status: "PENDING" },
    });

    const pendingLeaves = await prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { nama: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      totalKaryawan,
      hadirHariIni,
      terlambatHariIni,
      cutiPending,
      pendingLeaves,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
