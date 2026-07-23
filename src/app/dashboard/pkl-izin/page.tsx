"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { cn, formatDate, getStatusColor } from "@/lib/utils";
import { Role } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const pembimbingOptions = ["Miss Elvira", "Bu Khusnul", "Pak Gunarno"];
const keperluanOptions = [
  "Keperluan Keluarga",
  "Keperluan Sekolah",
  "Keadaan Darurat",
  "Sakit",
];

export default function PklIzinPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    namaLengkap: "",
    usernameTelegram: "",
    asalSekolah: "",
    pembimbingPkl: "",
    tanggalIzin: "",
    durasi: "",
    keperluan: "",
    keterangan: "",
  });

  const isViewer = role === "SUPER_ADMIN" || role === "HR" || role === "MANAGER";

  const { data: izinList, isLoading } = useQuery({
    queryKey: ["pkl-izin"],
    queryFn: async () => {
      const res = await fetch("/api/pkl-izin");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { bukti: string }) => {
      const res = await fetch("/api/pkl-izin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengajukan izin");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Izin PKL berhasil diajukan!");
      queryClient.invalidateQueries({ queryKey: ["pkl-izin"] });
      setShowForm(false);
      setFormData({
        namaLengkap: "",
        usernameTelegram: "",
        asalSekolah: "",
        pembimbingPkl: "",
        tanggalIzin: "",
        durasi: "",
        keperluan: "",
        keterangan: "",
      });
      setSelectedFiles([]);
      setUploadedUrls([]);
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
      status: string;
      catatan?: string;
    }) => {
      const res = await fetch(`/api/pkl-izin/${id}`, {
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
      toast.success("Status izin diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["pkl-izin"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pkl-izin/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus izin");
    },
    onSuccess: () => {
      toast.success("Izin berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["pkl-izin"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      toast.error("Maksimal 5 file");
      return;
    }
    setSelectedFiles(files);
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];
    setUploading(true);
    try {
      const fd = new FormData();
      selectedFiles.forEach((file) => fd.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal upload file");
      }
      const data = await res.json();
      setUploadedUrls(data.urls);
      return data.urls;
    } catch (err: any) {
      toast.error(err.message);
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.namaLengkap ||
      !formData.usernameTelegram ||
      !formData.asalSekolah ||
      !formData.pembimbingPkl ||
      !formData.tanggalIzin ||
      !formData.durasi ||
      !formData.keperluan ||
      !formData.keterangan
    ) {
      toast.error("Semua field harus diisi");
      return;
    }

    const urls = await uploadFiles();
    createMutation.mutate({ ...formData, bukti: JSON.stringify(urls) });
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
            Izin <span className="gradient-text">PKL</span>
          </h1>
          <p className="text-sm text-[hsl(var(--muted-fg))] mt-1 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Kelola pengajuan izin khusus siswa / peserta PKL
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.02] flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}
        >
          {showForm ? "✕ Batal Form" : "+ Buat Izin PKL Baru"}
        </button>
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
                🎓
              </div>
              <h3 className="font-bold text-base text-[hsl(var(--foreground))]">Form Pengajuan Izin PKL</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Nama Lengkap</label>
                <input type="text" value={formData.namaLengkap} onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })} className="input-base" placeholder="Nama lengkap..." />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Username Telegram</label>
                <input type="text" value={formData.usernameTelegram} onChange={(e) => setFormData({ ...formData, usernameTelegram: e.target.value })} className="input-base" placeholder="@username" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Asal Sekolah / Kampus</label>
                <input type="text" value={formData.asalSekolah} onChange={(e) => setFormData({ ...formData, asalSekolah: e.target.value })} className="input-base" placeholder="Nama sekolah/univ..." />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Pembimbing PKL</label>
                <select value={formData.pembimbingPkl} onChange={(e) => setFormData({ ...formData, pembimbingPkl: e.target.value })} className="input-base">
                  <option value="">Pilih pembimbing</option>
                  {pembimbingOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Tanggal Izin</label>
                <input type="date" value={formData.tanggalIzin} onChange={(e) => setFormData({ ...formData, tanggalIzin: e.target.value })} className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Durasi (Hari / Jam)</label>
                <input type="text" value={formData.durasi} onChange={(e) => setFormData({ ...formData, durasi: e.target.value })} className="input-base" placeholder="Contoh: 1 Hari / 3 Jam" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Keperluan</label>
                <select value={formData.keperluan} onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })} className="input-base">
                  <option value="">Pilih keperluan</option>
                  {keperluanOptions.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Upload Bukti (Maks 5 file)</label>
                <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="block w-full text-xs text-[hsl(var(--muted-fg))] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-500 cursor-pointer card-base p-2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Keterangan Tambahan</label>
              <textarea value={formData.keterangan} onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })} rows={3} className="input-base" placeholder="Jelaskan keterangan detail izin..." />
            </div>

            <button type="submit" disabled={createMutation.isPending || uploading} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2" style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}>
              {uploading || createMutation.isPending ? "Memproses..." : "Kirim Izin PKL"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Table Card ──────────────────────────────────────────── */}
      <div className="card-base overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <h3 className="font-bold text-base text-[hsl(var(--foreground))]">Daftar Izin PKL</h3>
          {izinList?.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
              {izinList.length} total
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.5]">
                <th className="py-3.5 px-6 table-header">Siswa / PKL</th>
                <th className="py-3.5 px-4 table-header">Sekolah</th>
                <th className="py-3.5 px-4 table-header">Keperluan</th>
                <th className="py-3.5 px-4 table-header">Tanggal</th>
                <th className="py-3.5 px-4 table-header">Pembimbing</th>
                <th className="py-3.5 px-4 table-header">Status</th>
                {isViewer && <th className="py-3.5 px-4 table-header">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[hsl(var(--muted-fg))]">Memuat data izin PKL...</td>
                </tr>
              ) : izinList?.length > 0 ? (
                izinList.map((item: any) => (
                  <tr key={item.id} className="border-b border-[hsl(var(--border))/0.5] hover:bg-[hsl(var(--muted))/0.3] transition-colors">
                    <td className="py-3.5 px-6 font-semibold">
                      <p className="text-sm font-semibold">{item.namaLengkap}</p>
                      <p className="text-[11px] text-[hsl(var(--muted-fg))] font-mono">{item.usernameTelegram}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs">{item.asalSekolah}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[hsl(var(--muted))]">{item.keperluan}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-sm font-medium">{formatDate(item.tanggalIzin)}</p>
                      <p className="text-[11px] text-[hsl(var(--muted-fg))]">Durasi: {item.durasi}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">{item.pembimbingPkl}</td>
                    <td className="py-3.5 px-4">
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", getStatusColor(item.status))}>
                        {item.status}
                      </span>
                    </td>
                    {isViewer && (
                      <td className="py-3.5 px-4">
                        {item.status === "PENDING" ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => approveMutation.mutate({ id: item.id, status: "DISETUJUI" })} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-semibold">Setujui</button>
                            <button onClick={() => approveMutation.mutate({ id: item.id, status: "DITOLAK" })} className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold">Tolak</button>
                          </div>
                        ) : (
                          <button onClick={() => deleteMutation.mutate(item.id)} className="text-xs text-red-500 hover:underline">Hapus</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[hsl(var(--muted-fg))]">Belum ada data izin PKL.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
