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

    const shifts = await prisma.shift.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error("Get shifts error:", error);
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

    const { nama, jamMasuk, jamPulang, toleransi } = await req.json();

    if (!nama || !jamMasuk || !jamPulang) {
      return NextResponse.json(
        { error: "Field wajib harus diisi" },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.create({
      data: { nama, jamMasuk, jamPulang, toleransi: toleransi || 15 },
    });

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Create shift error:", error);
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
    const { nama, jamMasuk, jamPulang, toleransi } = await req.json();

    if (!id || !nama || !jamMasuk || !jamPulang) {
      return NextResponse.json(
        { error: "Field wajib harus diisi" },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.update({
      where: { id },
      data: { nama, jamMasuk, jamPulang, toleransi: toleransi || 15 },
    });

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Update shift error:", error);
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

    await prisma.shift.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete shift error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
