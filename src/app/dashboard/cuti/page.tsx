"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { cn, formatDate, getStatusColor } from "@/lib/utils";
import { Role, LeaveType, LeaveStatus } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function CutiPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    tipe: "" as LeaveType | "",
    tanggalMulai: "",
    tanggalSelesai: "",
    alasan: "",
  });

  const isApprover = role === "MANAGER" || role === "HR" || role === "SUPER_ADMIN";

  const { data: leaves, isLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const res = await fetch("/api/cuti");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/cuti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengajukan cuti");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Pengajuan cuti berhasil!");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      setShowForm(false);
      setFormData({ tipe: "", tanggalMulai: "", tanggalSelesai: "", alasan: "" });
      setSelectedFile(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      catatan,
    }: {
      id: string;
      status: LeaveStatus;
      catatan?: string;
    }) => {
      const res = await fetch(`/api/cuti/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, catatan }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Status cuti diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cuti/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus pengajuan cuti");
      }
    },
    onSuccess: () => {
      toast.success("Pengajuan cuti berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", selectedFile);
      fd.append("folder", "cuti");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal upload file");
      }
      const data = await res.json();
      return data.urls[0] || null;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tipe || !formData.tanggalMulai || !formData.tanggalSelesai || !formData.alasan) {
      toast.error("Semua field harus diisi");
      return;
    }

    const lampiran = await uploadFile();
    createMutation.mutate({ ...formData, lampiran } as any);
  };

  const leaveTypes = [
    { value: "CUTI_TAHUNAN", label: "Cuti Tahunan" },
    { value: "CUTI_SAKIT", label: "Cuti Sakit" },
    { value: "CUTI_KELUARGA", label: "Cuti Keluarga" },
    { value: "CUTI_HAID", label: "Cuti Haid" },
    { value: "CUTI_MELAHIRKAN", label: "Cuti Melahirkan" },
    { value: "CUTI_IBADAH", label: "Cuti Ibadah" },
    { value: "CUTI_LAINNYA", label: "Cuti Lainnya" },
  ];

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
            Pengajuan <span className="gradient-text">Cuti</span>
          </h1>
          <p className="text-sm text-[hsl(var(--muted-fg))] mt-1 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Kelola pengajuan cuti dan izin karyawan
          </p>
        </div>
        {role === "KARYAWAN" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.02] flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}
          >
            {showForm ? (
              "✕ Batal Form"
            ) : (
              <>
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajukan Cuti Baru
              </>
            )}
          </button>
        )}
      </div>

      {/* ── Form Section ────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="card-base p-6 space-y-5 shadow-lg overflow-hidden border-indigo-500/30"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-[hsl(var(--border))]">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                ✍️
              </div>
              <h3 className="font-bold text-base text-[hsl(var(--foreground))]">Form Pengajuan Cuti Baru</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">
                  Tipe Cuti
                </label>
                <select
                  value={formData.tipe}
                  onChange={(e) =>
                    setFormData({ ...formData, tipe: e.target.value as LeaveType })
                  }
                  className="input-base"
                >
                  <option value="">Pilih tipe cuti</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.value} value={lt.value}>
                      {lt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={formData.tanggalMulai}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggalMulai: e.target.value })
                  }
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={formData.tanggalSelesai}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggalSelesai: e.target.value })
                  }
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">
                Alasan Pengajuan
              </label>
              <textarea
                value={formData.alasan}
                onChange={(e) =>
                  setFormData({ ...formData, alasan: e.target.value })
                }
                rows={3}
                className="input-base"
                placeholder="Jelaskan alasan pengajuan cuti secara rinci..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">
                Lampiran Dokumen (Opsional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-[hsl(var(--muted-fg))] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-500 hover:file:bg-indigo-500/20 cursor-pointer card-base p-2"
              />
              {selectedFile && (
                <div className="mt-2 flex items-center justify-between bg-[hsl(var(--muted))] rounded-xl px-4 py-2.5 text-xs max-w-sm">
                  <span className="truncate">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-red-500 hover:underline ml-2"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending || uploading}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}
            >
              {uploading || createMutation.isPending ? (
                <span>Memproses...</span>
              ) : (
                <span>Kirim Pengajuan Cuti</span>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Table Card ──────────────────────────────────────────── */}
      <div className="card-base overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <h3 className="font-bold text-base text-[hsl(var(--foreground))]">Daftar Pengajuan Cuti</h3>
          {leaves?.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
              {leaves.length} pengajuan
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.5]">
                <th className="py-3.5 px-6 table-header">Karyawan</th>
                <th className="py-3.5 px-4 table-header">Tipe</th>
                <th className="py-3.5 px-4 table-header">Tanggal</th>
                <th className="py-3.5 px-4 table-header">Alasan</th>
                <th className="py-3.5 px-4 table-header">Status</th>
                <th className="py-3.5 px-4 table-header">Lampiran</th>
                {isApprover && <th className="py-3.5 px-4 table-header">Aksi</th>}
                {(role === "HR" || role === "SUPER_ADMIN") && <th className="py-3.5 px-4 table-header">Hapus</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[hsl(var(--muted-fg))]">
                    Memuat data cuti...
                  </td>
                </tr>
              ) : leaves?.length > 0 ? (
                leaves.map((leave: any) => (
                  <tr key={leave.id} className="border-b border-[hsl(var(--border))/0.5] hover:bg-[hsl(var(--muted))/0.3] transition-colors">
                    <td className="py-3.5 px-6 font-semibold">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {leave.user?.nama?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{leave.user?.nama}</p>
                          <p className="text-[11px] text-[hsl(var(--muted-fg))] font-mono">{leave.user?.nomorInduk}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[hsl(var(--muted))] capitalize">
                        {leave.tipe.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-sm font-medium">{formatDate(leave.tanggalMulai)}</p>
                      <p className="text-[11px] text-[hsl(var(--muted-fg))]">s/d {formatDate(leave.tanggalSelesai)}</p>
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate text-xs text-[hsl(var(--muted-fg))]" title={leave.alasan}>
                      {leave.alasan}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", getStatusColor(leave.status))}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {leave.lampiran ? (
                        <a
                          href={leave.lampiran}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-indigo-500 hover:underline"
                        >
                          📎 Lihat
                        </a>
                      ) : (
                        <span className="text-xs text-[hsl(var(--muted-fg))]">-</span>
                      )}
                    </td>
                    {isApprover && leave.status === "PENDING" && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approveMutation.mutate({ id: leave.id, status: "DISETUJUI" })}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-semibold"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => approveMutation.mutate({ id: leave.id, status: "DITOLAK" })}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold"
                          >
                            Tolak
                          </button>
                        </div>
                      </td>
                    )}
                    {(role === "HR" || role === "SUPER_ADMIN") && (
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => deleteMutation.mutate(leave.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[hsl(var(--muted-fg))]">
                    Belum ada pengajuan cuti.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
