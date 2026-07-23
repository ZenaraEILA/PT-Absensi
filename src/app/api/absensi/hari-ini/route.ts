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

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        tanggal: { gte: startOfDay, lt: endOfDay },
      },
      select: {
        id: true,
        tanggal: true,
        checkIn: true,
        checkOut: true,
        status: true,
        keterangan: true,
        fotoCheckIn: true,
        fotoCheckOut: true,
        latCheckIn: true,
        lngCheckIn: true,
        latCheckOut: true,
        lngCheckOut: true,
        verifikasi: true,
        catatanVerifikasi: true,
        verifikasiBy: { select: { nama: true } },
        user: {
          select: {
            shift: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(null);
    }

    // Jangan kirim foto base64 ke client (terlalu besar)
    const { fotoCheckIn, fotoCheckOut, verifikasiBy, ...data } = attendance;
    return NextResponse.json({
      ...data,
      hasPhoto: !!(fotoCheckIn || fotoCheckOut),
      verifikasiBy: verifikasiBy?.nama || null,
    });
  } catch (error) {
    console.error("My attendance today error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
