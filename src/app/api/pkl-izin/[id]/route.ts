import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function PATCH(
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

    const { status, catatan } = await req.json();

    const izin = await prisma.pklIzin.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(catatan !== undefined && { catatan }),
      },
    });

    // Create notification for the employee
    if (status) {
      await prisma.notification.create({
        data: {
          userId: izin.userId,
          judul: "Izin PKL",
          pesan: `Pengajuan izin PKL Anda ${
            status === "DISETUJUI" ? "disetujui" : "ditolak"
          }`,
          tipe: status === "DISETUJUI" ? "success" : "error",
          link: "/dashboard/pkl-izin",
        },
      });
    }

    return NextResponse.json(izin);
  } catch (error) {
    console.error("Update PKL Izin error:", error);
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

    // Get the record to clean up files
    const izin = await prisma.pklIzin.findUnique({
      where: { id: params.id },
    });

    if (izin?.bukti) {
      try {
        const files = JSON.parse(izin.bukti);
        for (const filePath of files) {
          const fullPath = path.join(
            process.cwd(),
            "public",
            filePath.replace(/^\//, "")
          );
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      } catch (_) {
        // Ignore file cleanup errors
      }
    }

    await prisma.pklIzin.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete PKL Izin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
