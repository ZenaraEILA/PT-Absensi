import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");

    const where: any = {};

    if (startDate && endDate) {
      where.tanggal = {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 86400000),
      };
    }

    if (departmentId) {
      where.user = { departmentId };
    }

    if (status) {
      where.status = status;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            nama: true,
            nomorInduk: true,
            department: { select: { nama: true } },
          },
        },
      },
      orderBy: [{ tanggal: "desc" }, { user: { nama: "asc" } }],
    });

    const data = attendances.map((att) => ({
      "Nomor Induk": att.user.nomorInduk,
      Nama: att.user.nama,
      Departemen: att.user.department?.nama || "-",
      Tanggal: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
        new Date(att.tanggal)
      ),
      "Check In": att.checkIn
        ? new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(att.checkIn))
        : "-",
      "Check Out": att.checkOut
        ? new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(att.checkOut))
        : "-",
      Status: att.status,
      Keterangan: att.keterangan || "-",
    }));

    // Summary row
    data.push({
      "Nomor Induk": "",
      Nama: "RINGKASAN",
      Departemen: "",
      Tanggal: "",
      "Check In": "",
      "Check Out": "",
      Status: `Total: ${attendances.length}`,
      Keterangan: `Hadir: ${attendances.filter((a) => a.status === "HADIR").length} | Terlambat: ${attendances.filter((a) => a.status === "TERLAMBAT").length} | Izin: ${attendances.filter((a) => a.status === "IZIN").length} | Sakit: ${attendances.filter((a) => a.status === "SAKIT").length} | Alpha: ${attendances.filter((a) => a.status === "ALPA").length} | Cuti: ${attendances.filter((a) => a.status === "CUTI").length}`,
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Column widths
    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 30 },
      { wch: 15 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 60 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const filename = `laporan-absensi-${startDate || "all"}-${endDate || "all"}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
