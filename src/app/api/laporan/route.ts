import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");

    const where: any = {};

    if (startDate && endDate) {
      where.tanggal = {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 86400000),
      };
    }

    if (departmentId) {
      where.user = { departmentId };
    }

    if (status) {
      where.status = status;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            nama: true,
            nomorInduk: true,
            department: { select: { nama: true } },
          },
        },
      },
      orderBy: [{ tanggal: "desc" }, { user: { nama: "asc" } }],
    });

    // Summary with verifikasi stats
    const summary = {
      total: attendances.length,
      hadir: attendances.filter((a) => a.status === "HADIR").length,
      terlambat: attendances.filter((a) => a.status === "TERLAMBAT").length,
      izin: attendances.filter((a) => a.status === "IZIN").length,
      sakit: attendances.filter((a) => a.status === "SAKIT").length,
      alpha: attendances.filter((a) => a.status === "ALPA").length,
      belumDiverifikasi: attendances.filter((a) => !a.verifikasi).length,
      aman: attendances.filter((a) => a.verifikasi === "AMAN").length,
      berbohong: attendances.filter((a) => a.verifikasi === "BERBOHONG").length,
    };

    return NextResponse.json({ data: attendances, summary });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
