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

    const isAdmin =
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "HR" ||
      session.user.role === "MANAGER";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { startOfDay, endOfDay } = getWIBRange();

    // Ambil semua user aktif
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nomorInduk: true,
        nama: true,
        jabatan: true,
        department: { select: { nama: true } },
      },
      orderBy: { nama: "asc" },
    });

    // Ambil attendance hari ini (tanpa foto base64 biar ringan)
    const todayAttendances = await prisma.attendance.findMany({
      where: {
        tanggal: { gte: startOfDay, lt: endOfDay },
      },
      select: {
        id: true,
        userId: true,
        checkIn: true,
        checkOut: true,
        status: true,
        keterangan: true,
        verifikasi: true,
        catatanVerifikasi: true,
        verifikasiBy: { select: { nama: true } },
      },
    });

    // Query terpisah untuk cek keberadaan foto (tanpa ambil data base64-nya)
    const attendanceIdsWithFotoIn = await prisma.attendance.findMany({
      where: {
        tanggal: { gte: startOfDay, lt: endOfDay },
        fotoCheckIn: { not: null },
      },
      select: { id: true },
    });
    const attendanceIdsWithFotoOut = await prisma.attendance.findMany({
      where: {
        tanggal: { gte: startOfDay, lt: endOfDay },
        fotoCheckOut: { not: null },
      },
      select: { id: true },
    });

    const fotoInSet = new Set(attendanceIdsWithFotoIn.map((a) => a.id));
    const fotoOutSet = new Set(attendanceIdsWithFotoOut.map((a) => a.id));

    // Map attendance per user
    const attendanceMap = new Map(
      todayAttendances.map((a) => [a.userId, a])
    );

    const result = users.map((user) => {
      const att = attendanceMap.get(user.id);
      return {
        id: user.id,
        nomorInduk: user.nomorInduk,
        nama: user.nama,
        jabatan: user.jabatan,
        departemen: user.department?.nama || "-",
        attendance: att
          ? {
              id: att.id,
              checkIn: att.checkIn,
              checkOut: att.checkOut,
              status: att.status,
              keterangan: att.keterangan,
              hasFotoCheckIn: fotoInSet.has(att.id),
              hasFotoCheckOut: fotoOutSet.has(att.id),
              verifikasi: att.verifikasi,
              catatanVerifikasi: att.catatanVerifikasi,
              verifikasiBy: att.verifikasiBy?.nama || null,
            }
          : null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("All attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
