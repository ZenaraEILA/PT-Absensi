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

    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Get departments error:", error);
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

    const { nama, deskripsi } = await req.json();

    if (!nama) {
      return NextResponse.json(
        { error: "Nama departemen harus diisi" },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: { nama, deskripsi },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("Create department error:", error);
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
    const { nama, deskripsi } = await req.json();

    if (!id || !nama) {
      return NextResponse.json(
        { error: "Nama departemen harus diisi" },
        { status: 400 }
      );
    }

    const department = await prisma.department.update({
      where: { id },
      data: { nama, deskripsi },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("Update department error:", error);
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

    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete department error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
