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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nama: true,
        noTelpon: true,
        alamat: true,
        email: true,
        nomorInduk: true,
        role: true,
        jabatan: true,
        foto: true,
        tanggalMasuk: true,
        department: { select: { id: true, nama: true } },
        shift: { select: { id: true, nama: true, jamMasuk: true, jamPulang: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nama, noTelpon, alamat, foto } = await req.json();

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(nama !== undefined && { nama }),
        ...(noTelpon !== undefined && { noTelpon }),
        ...(alamat !== undefined && { alamat }),
        ...(foto !== undefined && { foto }),
      },
    });

    return NextResponse.json({
      id: user.id,
      nama: user.nama,
      noTelpon: user.noTelpon,
      alamat: user.alamat,
      foto: user.foto,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
