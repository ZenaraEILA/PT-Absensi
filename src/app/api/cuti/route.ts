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

    const isApprover =
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "HR" ||
      session.user.role === "MANAGER";

    const where = isApprover
      ? {}
      : { userId: session.user.id };

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: { nama: true, nomorInduk: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("Leave requests error:", error);
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

    const { tipe, tanggalMulai, tanggalSelesai, alasan, lampiran } = await req.json();

    if (!tipe || !tanggalMulai || !tanggalSelesai || !alasan) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: session.user.id,
        tipe,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        alasan,
        lampiran: lampiran || null,
      },
    });

    return NextResponse.json(leave);
  } catch (error) {
    console.error("Create leave error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
