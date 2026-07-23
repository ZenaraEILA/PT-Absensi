import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Endpoint untuk mengambil foto absensi berdasarkan ID attendance
// Mengembalikan base64 foto check-in atau check-out
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        fotoCheckIn: true,
        fotoCheckOut: true,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Data absensi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hanya user yang bersangkutan atau admin/HR yang bisa lihat
    const isAdmin =
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "HR" ||
      session.user.role === "MANAGER";

    if (attendance.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      fotoCheckIn: attendance.fotoCheckIn || null,
      fotoCheckOut: attendance.fotoCheckOut || null,
    });
  } catch (error) {
    console.error("Fetch foto error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
