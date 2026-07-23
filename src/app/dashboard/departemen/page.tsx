"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function DepartemenPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nama: "", deskripsi: "" });

  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departemen");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/departemen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menambah departemen");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Departemen berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setShowForm(false);
      setFormData({ nama: "", deskripsi: "" });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch(`/api/departemen?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengupdate departemen");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Departemen berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setShowForm(false);
      setEditingId(null);
      setFormData({ nama: "", deskripsi: "" });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/departemen?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus departemen");
    },
    onSuccess: () => {
      toast.success("Departemen berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleEdit = (d: any) => {
    setEditingId(d.id);
    setFormData({ nama: d.nama || "", deskripsi: d.deskripsi || "" });
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
            Data <span className="gradient-text">Departemen</span>
          </h1>
          <p className="text-sm text-[hsl(var(--muted-fg))] mt-1 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Kelola divisi kerja dan struktur organisasi perusahaan
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
          {showForm ? "✕ Batal" : "+ Tambah Departemen Baru"}
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
                🏢
              </div>
              <h3 className="font-bold text-base text-[hsl(var(--foreground))]">
                {editingId ? "Edit Departemen" : "Form Tambah Departemen Baru"}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Nama Departemen</label>
                <input type="text" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="input-base" placeholder="Contoh: Engineering / Marketing / HR" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Deskripsi Singkat</label>
                <textarea value={formData.deskripsi} onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} rows={3} className="input-base" placeholder="Penjelasan divisi kerja..." />
              </div>
            </div>

            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2" style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}>
              {editingId ? "Simpan Perubahan" : "Tambah Departemen"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Department Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-[hsl(var(--muted-fg))]">Memuat data departemen...</div>
        ) : departments?.length > 0 ? (
          departments.map((d: any) => (
            <div key={d.id} className="card-base p-6 hover:shadow-glow transition-all duration-300 relative group flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-lg font-bold mb-4">
                  🏢
                </div>
                <h3 className="text-lg font-extrabold text-[hsl(var(--foreground))]">{d.nama}</h3>
                <p className="text-xs text-[hsl(var(--muted-fg))] mt-2 leading-relaxed">{d.deskripsi || "Tidak ada deskripsi."}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[hsl(var(--border))] flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                  {d._count?.users ?? 0} Karyawan
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleEdit(d)} className="text-xs font-semibold text-indigo-500 hover:underline">Edit</button>
                  <button onClick={() => deleteMutation.mutate(d.id)} className="text-xs font-semibold text-red-500 hover:underline">Hapus</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-[hsl(var(--muted-fg))]">Belum ada data departemen.</div>
        )}
      </div>
    </motion.div>
  );
}
