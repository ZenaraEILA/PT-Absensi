import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const { verifikasi, catatan } = await req.json();

    if (!verifikasi || !["AMAN", "BERBOHONG"].includes(verifikasi)) {
      return NextResponse.json(
        { error: "Status verifikasi harus AMAN atau BERBOHONG" },
        { status: 400 }
      );
    }

    // Check if attendance exists
    const attendance = await prisma.attendance.findUnique({
      where: { id: params.id },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Data absensi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Update verifikasi
    const updated = await prisma.attendance.update({
      where: { id: params.id },
      data: {
        verifikasi,
        catatanVerifikasi: catatan || null,
        verifikasiById: session.user.id,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Verifikasi berhasil: ${verifikasi === "AMAN" ? "Aman" : "Berbohong"}`,
      data: updated,
    });
  } catch (error) {
    console.error("Verifikasi error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
