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
    if (
      !session?.user ||
      (session.user.role !== "SUPER_ADMIN" &&
        session.user.role !== "HR" &&
        session.user.role !== "MANAGER")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, catatan } = await req.json();

    const leave = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        status,
        catatanPersetujuan: catatan,
      },
    });

    // Create notification for the employee
    await prisma.notification.create({
      data: {
        userId: leave.userId,
        judul: "Pengajuan Cuti",
        pesan: `Pengajuan cuti ${
          status === "DISETUJUI" ? "disetujui" : "ditolak"
        }`,
        tipe: status === "DISETUJUI" ? "success" : "error",
        link: "/dashboard/cuti",
      },
    });

    return NextResponse.json(leave);
  } catch (error) {
    console.error("Update leave error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== "SUPER_ADMIN" && session.user.role !== "HR")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete associated approvals first to avoid foreign key constraint
    await prisma.approval.deleteMany({
      where: { leaveRequestId: params.id },
    });

    await prisma.leaveRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete leave error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
