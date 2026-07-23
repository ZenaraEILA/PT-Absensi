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

    const isViewer =
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "HR" ||
      session.user.role === "MANAGER";

    const where = isViewer ? {} : { userId: session.user.id };

    const izin = await prisma.pklIzin.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(izin);
  } catch (error) {
    console.error("PKL Izin fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      namaLengkap,
      usernameTelegram,
      asalSekolah,
      pembimbingPkl,
      tanggalIzin,
      durasi,
      keperluan,
      keterangan,
      bukti,
    } = await req.json();

    if (
      !namaLengkap ||
      !usernameTelegram ||
      !asalSekolah ||
      !pembimbingPkl ||
      !tanggalIzin ||
      !durasi ||
      !keperluan ||
      !keterangan
    ) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    const izin = await prisma.pklIzin.create({
      data: {
        userId: session.user.id,
        namaLengkap,
        usernameTelegram,
        asalSekolah,
        pembimbingPkl,
        tanggalIzin: new Date(tanggalIzin),
        durasi,
        keperluan,
        keterangan,
        bukti: bukti || "[]",
      },
    });

    return NextResponse.json(izin);
  } catch (error) {
    console.error("Create PKL Izin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
