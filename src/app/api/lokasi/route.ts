import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== "SUPER_ADMIN" && session.user.role !== "HR")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const locations = await prisma.location.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Get locations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== "SUPER_ADMIN" && session.user.role !== "HR")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { nama, latitude, longitude, radius } = await req.json();

    if (!nama || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Field wajib harus diisi" },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        nama,
        latitude,
        longitude,
        radius: radius || 100,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Create location error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== "SUPER_ADMIN" && session.user.role !== "HR")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();
    const { nama, latitude, longitude, radius, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // Izinkan partial update — hanya field yang dikirim akan diubah
    const data: Record<string, any> = {};
    if (nama !== undefined) data.nama = nama;
    if (latitude !== undefined) data.latitude = latitude;
    if (longitude !== undefined) data.longitude = longitude;
    if (radius !== undefined) data.radius = radius;
    if (isActive !== undefined) data.isActive = isActive;

    if (!data.nama || data.latitude === undefined || data.longitude === undefined) {
      // Jika tidak mengirim field lokasi utama, pastikan setidaknya ada field lain
      if (Object.keys(data).length === 0) {
        return NextResponse.json(
          { error: "Tidak ada data yang diupdate" },
          { status: 400 }
        );
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data,
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Update location error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== "SUPER_ADMIN" && session.user.role !== "HR")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete location error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
