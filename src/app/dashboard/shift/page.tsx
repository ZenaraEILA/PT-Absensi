"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ShiftPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    jamMasuk: "",
    jamPulang: "",
    toleransi: 15,
  });

  const { data: shifts, isLoading } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await fetch("/api/shift");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menambah shift");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Shift berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setShowForm(false);
      setFormData({ nama: "", jamMasuk: "", jamPulang: "", toleransi: 15 });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch(`/api/shift?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengupdate shift");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Shift berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setShowForm(false);
      setEditingId(null);
      setFormData({ nama: "", jamMasuk: "", jamPulang: "", toleransi: 15 });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shift?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus shift");
    },
    onSuccess: () => {
      toast.success("Shift berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setFormData({
      nama: s.nama || "",
      jamMasuk: s.jamMasuk || "",
      jamPulang: s.jamPulang || s.jamKeluar || "",
      toleransi: s.toleransi ?? 15,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
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
            Pengaturan <span className="gradient-text">Shift Kerja</span>
          </h1>
          <p className="text-sm text-[hsl(var(--muted-fg))] mt-1 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Atur jam kerja, jadwal shift, dan keterlambatan
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
            } else {
              setShowForm(true);
            }
          }}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.02] flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}
        >
          {showForm ? "✕ Batal" : "+ Tambah Shift Baru"}
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
                ⏰
              </div>
              <h3 className="font-bold text-base text-[hsl(var(--foreground))]">
                {editingId ? "Edit Shift Kerja" : "Form Tambah Shift Kerja Baru"}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Nama Shift</label>
                <input type="text" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="input-base" placeholder="Contoh: Shift Pagi" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Jam Masuk</label>
                <input type="time" value={formData.jamMasuk} onChange={(e) => setFormData({ ...formData, jamMasuk: e.target.value })} className="input-base" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Jam Pulang</label>
                <input type="time" value={formData.jamPulang} onChange={(e) => setFormData({ ...formData, jamPulang: e.target.value })} className="input-base" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Toleransi (Menit)</label>
                <input type="number" value={formData.toleransi} onChange={(e) => setFormData({ ...formData, toleransi: Number(e.target.value) })} className="input-base" placeholder="15" required />
              </div>
            </div>

            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2" style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}>
              {editingId ? "Simpan Perubahan" : "Tambah Shift"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Shift Cards / Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-[hsl(var(--muted-fg))]">Memuat data shift...</div>
        ) : shifts?.length > 0 ? (
          shifts.map((s: any) => (
            <div key={s.id} className="card-base p-6 hover:shadow-glow transition-all duration-300 relative group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-[hsl(var(--foreground))]">{s.nama}</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
                  Toleransi {s.toleransi ?? 15}m
                </span>
              </div>
              <div className="space-y-2 text-sm text-[hsl(var(--muted-fg))]">
                <div className="flex justify-between">
                  <span>Jam Masuk:</span>
                  <span className="font-mono font-bold text-[hsl(var(--foreground))]">{s.jamMasuk}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jam Pulang:</span>
                  <span className="font-mono font-bold text-[hsl(var(--foreground))]">{s.jamPulang || s.jamKeluar}</span>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-[hsl(var(--border))] flex justify-end gap-3">
                <button onClick={() => handleEdit(s)} className="text-xs font-semibold text-indigo-500 hover:underline">Edit</button>
                <button onClick={() => deleteMutation.mutate(s.id)} className="text-xs font-semibold text-red-500 hover:underline">Hapus</button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-[hsl(var(--muted-fg))]">Belum ada data shift kerja.</div>
        )}
      </div>
    </motion.div>
  );
}
