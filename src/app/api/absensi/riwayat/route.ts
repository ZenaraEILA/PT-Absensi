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

    const attendances = await prisma.attendance.findMany({
      where: { userId: session.user.id },
      orderBy: { tanggal: "desc" },
      take: 30,
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
      },
    });

    // Strip base64 foto dari response (terlalu besar)
    const result = attendances.map((a) => ({
      id: a.id,
      tanggal: a.tanggal,
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      status: a.status,
      keterangan: a.keterangan,
      fotoCheckIn: a.fotoCheckIn ? true : null,
      fotoCheckOut: a.fotoCheckOut ? true : null,
      verifikasi: a.verifikasi,
      catatanVerifikasi: a.catatanVerifikasi,
      verifikasiBy: a.verifikasiBy?.nama || null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Attendance history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
