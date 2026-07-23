import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== "SUPER_ADMIN" && session.user.role !== "HR")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        department: { select: { nama: true } },
        shift: { select: { nama: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
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

    const {
      nomorInduk,
      email,
      nama,
      password,
      role,
      jabatan,
      noTelpon,
      alamat,
      departmentId,
      shiftId,
    } = await req.json();

    if (!nomorInduk || !email || !nama || !password) {
      return NextResponse.json(
        { error: "Field wajib harus diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ nomorInduk }, { email }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Nomor induk atau email sudah terdaftar" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        nomorInduk,
        email,
        nama,
        password: hashedPassword,
        role: role || "KARYAWAN",
        jabatan,
        noTelpon,
        alamat,
        departmentId: departmentId || null,
        shiftId: shiftId || null,
      },
    });

    return NextResponse.json({
      id: user.id,
      nomorInduk: user.nomorInduk,
      email: user.email,
      nama: user.nama,
      role: user.role,
    });
  } catch (error) {
    console.error("Create user error:", error);
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

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const {
      nomorInduk,
      email,
      nama,
      password,
      role,
      jabatan,
      noTelpon,
      alamat,
      departmentId,
      shiftId,
    } = await req.json();

    if (!nomorInduk || !email || !nama) {
      return NextResponse.json(
        { error: "Field wajib harus diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ nomorInduk }, { email }],
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Nomor induk atau email sudah terdaftar" },
        { status: 400 }
      );
    }

    const data: any = {
      nomorInduk,
      email,
      nama,
      role: role || "KARYAWAN",
      jabatan,
      noTelpon,
      alamat,
      departmentId: departmentId || null,
      shiftId: shiftId || null,
    };

    if (password) {
      data.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: user.id,
      nomorInduk: user.nomorInduk,
      email: user.email,
      nama: user.nama,
      role: user.role,
    });
  } catch (error) {
    console.error("Update user error:", error);
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

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
