"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatDate, cn, getStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function LaporanPage() {
  const defaultFilter = {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    departmentId: "",
    status: "",
  };

  const [editFilter, setEditFilter] = useState(defaultFilter);
  const [appliedFilter, setAppliedFilter] = useState(defaultFilter);

  const { data: departments } = useQuery({
    queryKey: ["departments-report"],
    queryFn: async () => {
      const res = await fetch("/api/departemen");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const isFilterActive =
    appliedFilter.startDate !== defaultFilter.startDate ||
    appliedFilter.endDate !== defaultFilter.endDate ||
    appliedFilter.departmentId !== "" ||
    appliedFilter.status !== "";

  const { data: report, isLoading } = useQuery({
    queryKey: ["attendance-report", appliedFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: appliedFilter.startDate,
        endDate: appliedFilter.endDate,
      });
      if (appliedFilter.departmentId) params.set("departmentId", appliedFilter.departmentId);
      if (appliedFilter.status) params.set("status", appliedFilter.status);

      const res = await fetch(`/api/laporan?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const terapkanFilter = () => {
    setAppliedFilter({ ...editFilter });
    toast.success("Filter diterapkan");
  };

  const resetFilter = () => {
    setEditFilter(defaultFilter);
    setAppliedFilter(defaultFilter);
    toast.success("Filter direset");
  };

  const downloadExcel = async () => {
    try {
      const params = new URLSearchParams({
        startDate: appliedFilter.startDate,
        endDate: appliedFilter.endDate,
        format: "excel",
      });
      if (appliedFilter.departmentId) params.set("departmentId", appliedFilter.departmentId);

      const res = await fetch(`/api/laporan/export?${params}`);
      if (!res.ok) throw new Error("Gagal mengunduh");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-absensi-${appliedFilter.startDate}-${appliedFilter.endDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Gagal mengunduh laporan");
    }
  };

  const summary = report?.summary || {
    total: 0,
    hadir: 0,
    terlambat: 0,
    alpha: 0,
    izin: 0,
    sakit: 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
            Laporan <span className="gradient-text">Absensi</span>
          </h1>
          <p className="text-sm text-[hsl(var(--muted-fg))] mt-1 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Rekap performa absensi dan kehadiran karyawan
          </p>
        </div>
        <button
          onClick={downloadExcel}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.02] flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          📥 Export Excel (.xlsx)
        </button>
      </div>

      {/* ── Filter Card ─────────────────────────────────────────── */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-fg))] flex items-center gap-2">
            🔍 Filter Periode & Departemen
          </h3>
          {isFilterActive && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
              Filter Aktif
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Mulai Tanggal</label>
            <input type="date" value={editFilter.startDate} onChange={(e) => setEditFilter({ ...editFilter, startDate: e.target.value })} className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Sampai Tanggal</label>
            <input type="date" value={editFilter.endDate} onChange={(e) => setEditFilter({ ...editFilter, endDate: e.target.value })} className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Departemen</label>
            <select value={editFilter.departmentId} onChange={(e) => setEditFilter({ ...editFilter, departmentId: e.target.value })} className="input-base">
              <option value="">Semua Departemen</option>
              {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.nama}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={terapkanFilter} className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition">Terapkan</button>
            <button onClick={resetFilter} className="px-3 py-2.5 rounded-xl font-semibold text-xs text-[hsl(var(--muted-fg))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] transition">Reset</button>
          </div>
        </div>
      </div>

      {/* ── Summary Bento Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card-base p-4 text-center">
          <p className="text-[11px] font-semibold uppercase text-[hsl(var(--muted-fg))]">Total Record</p>
          <p className="text-2xl font-extrabold text-[hsl(var(--foreground))] mt-1">{summary.total}</p>
        </div>
        <div className="card-base p-4 text-center border-emerald-500/30">
          <p className="text-[11px] font-semibold uppercase text-emerald-500">Hadir</p>
          <p className="text-2xl font-extrabold text-emerald-500 mt-1">{summary.hadir}</p>
        </div>
        <div className="card-base p-4 text-center border-amber-500/30">
          <p className="text-[11px] font-semibold uppercase text-amber-500">Terlambat</p>
          <p className="text-2xl font-extrabold text-amber-500 mt-1">{summary.terlambat}</p>
        </div>
        <div className="card-base p-4 text-center border-blue-500/30">
          <p className="text-[11px] font-semibold uppercase text-blue-500">Izin</p>
          <p className="text-2xl font-extrabold text-blue-500 mt-1">{summary.izin}</p>
        </div>
        <div className="card-base p-4 text-center border-indigo-500/30">
          <p className="text-[11px] font-semibold uppercase text-indigo-500">Sakit</p>
          <p className="text-2xl font-extrabold text-indigo-500 mt-1">{summary.sakit}</p>
        </div>
        <div className="card-base p-4 text-center border-red-500/30">
          <p className="text-[11px] font-semibold uppercase text-red-500">Alpha</p>
          <p className="text-2xl font-extrabold text-red-500 mt-1">{summary.alpha}</p>
        </div>
      </div>

      {/* ── Table Card ──────────────────────────────────────────── */}
      <div className="card-base overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-[hsl(var(--border))]">
          <h3 className="font-bold text-base text-[hsl(var(--foreground))]">Rincian Laporan Absensi</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.5]">
                <th className="py-3.5 px-6 table-header">Tanggal</th>
                <th className="py-3.5 px-4 table-header">Karyawan</th>
                <th className="py-3.5 px-4 table-header">Departemen</th>
                <th className="py-3.5 px-4 table-header">Check In</th>
                <th className="py-3.5 px-4 table-header">Check Out</th>
                <th className="py-3.5 px-4 table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[hsl(var(--muted-fg))]">Memuat laporan...</td>
                </tr>
              ) : report?.attendances?.length > 0 ? (
                report.attendances.map((att: any) => (
                  <tr key={att.id} className="border-b border-[hsl(var(--border))/0.5] hover:bg-[hsl(var(--muted))/0.3] transition-colors">
                    <td className="py-3.5 px-6 font-semibold">{formatDate(att.tanggal)}</td>
                    <td className="py-3.5 px-4">
                      <p className="text-sm font-semibold">{att.user?.nama}</p>
                      <p className="text-[11px] text-[hsl(var(--muted-fg))] font-mono">{att.user?.nomorInduk}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">{att.user?.department?.nama || "-"}</td>
                    <td className="py-3.5 px-4 text-xs font-mono">{att.checkIn ? new Date(att.checkIn).toLocaleTimeString("id-ID") : "-"}</td>
                    <td className="py-3.5 px-4 text-xs font-mono">{att.checkOut ? new Date(att.checkOut).toLocaleTimeString("id-ID") : "-"}</td>
                    <td className="py-3.5 px-4">
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", getStatusColor(att.status))}>
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[hsl(var(--muted-fg))]">Tidak ada data absensi untuk periode ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
