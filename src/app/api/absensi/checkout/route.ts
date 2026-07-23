import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWIBRange, isWithinRadius } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Format data tidak valid" },
        { status: 400 }
      );
    }

    const { foto, lat, lng } = body;

    // Validasi lokasi
    if (lat === undefined || lng === undefined || lat === null || lng === null) {
      return NextResponse.json(
        { error: "Lokasi GPS diperlukan. Silakan aktifkan GPS." },
        { status: 400 }
      );
    }

    // Validasi radius lokasi kantor
    const locations = await prisma.location.findMany({
      where: { isActive: true },
    });

    if (locations.length > 0) {
      const inRadius = locations.some((loc) =>
        isWithinRadius(Number(lat), Number(lng), loc.latitude, loc.longitude, loc.radius)
      );

      if (!inRadius) {
        return NextResponse.json(
          { error: "Anda berada di luar area yang diizinkan untuk absensi." },
          { status: 403 }
        );
      }
    }

    // Cari absensi hari ini
    const { startOfDay, endOfDay } = getWIBRange();

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        tanggal: { gte: startOfDay, lt: endOfDay },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Anda belum melakukan check-in hari ini" },
        { status: 400 }
      );
    }

    if (attendance.checkOut) {
      return NextResponse.json(
        { error: "Anda sudah melakukan check-out hari ini" },
        { status: 400 }
      );
    }

    // Truncate foto jika terlalu besar
    let fotoFinal = foto;
    if (foto && typeof foto === "string" && foto.length > 500000) {
      fotoFinal = foto.substring(0, 500000);
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date(),
        fotoCheckOut: fotoFinal,
        latCheckOut: lat,
        lngCheckOut: lng,
      },
    });

    return NextResponse.json({
      ...updated,
      fotoCheckIn: updated.fotoCheckIn ? "(photo)" : null,
      fotoCheckOut: updated.fotoCheckOut ? "(photo)" : null,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
