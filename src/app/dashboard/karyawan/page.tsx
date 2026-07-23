"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatDate, getRoleLabel } from "@/lib/utils";
import { Role } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function KaryawanPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nomorInduk: "",
    email: "",
    nama: "",
    password: "",
    role: "KARYAWAN" as Role,
    jabatan: "",
    noTelpon: "",
    alamat: "",
    departmentId: "",
    shiftId: "",
  });

  const { data: karyawan, isLoading } = useQuery({
    queryKey: ["karyawan"],
    queryFn: async () => {
      const res = await fetch("/api/karyawan");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments-list"],
    queryFn: async () => {
      const res = await fetch("/api/departemen");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: shifts } = useQuery({
    queryKey: ["shifts-list"],
    queryFn: async () => {
      const res = await fetch("/api/shift");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/karyawan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menambah karyawan");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Karyawan berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["karyawan"] });
      setShowForm(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch(`/api/karyawan?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengupdate karyawan");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Data karyawan diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["karyawan"] });
      setShowForm(false);
      setEditingId(null);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/karyawan?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus karyawan");
    },
    onSuccess: () => {
      toast.success("Karyawan berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["karyawan"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const resetForm = () => {
    setFormData({
      nomorInduk: "",
      email: "",
      nama: "",
      password: "",
      role: "KARYAWAN",
      jabatan: "",
      noTelpon: "",
      alamat: "",
      departmentId: "",
      shiftId: "",
    });
  };

  const handleEdit = (k: any) => {
    setEditingId(k.id);
    setFormData({
      nomorInduk: k.nomorInduk || "",
      email: k.email || "",
      nama: k.nama || "",
      password: "",
      role: k.role || "KARYAWAN",
      jabatan: k.jabatan || "",
      noTelpon: k.noTelpon || "",
      alamat: k.alamat || "",
      departmentId: k.departmentId || "",
      shiftId: k.shiftId || "",
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
            Data <span className="gradient-text">Karyawan</span>
          </h1>
          <p className="text-sm text-[hsl(var(--muted-fg))] mt-1 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Kelola data staf, jabatan, departemen, dan hak akses
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.02] flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}
        >
          {showForm ? "✕ Batal" : "+ Tambah Karyawan Baru"}
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
                👤
              </div>
              <h3 className="font-bold text-base text-[hsl(var(--foreground))]">
                {editingId ? "Edit Data Karyawan" : "Form Tambah Karyawan Baru"}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Nomor Induk (NIP)</label>
                <input type="text" value={formData.nomorInduk} onChange={(e) => setFormData({ ...formData, nomorInduk: e.target.value })} className="input-base" placeholder="Contoh: EMP001" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Nama Lengkap</label>
                <input type="text" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="input-base" placeholder="Nama lengkap..." required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-base" placeholder="email@perusahaan.com" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Password {editingId && "(kosongkan jika tak diubah)"}</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-base" placeholder="••••••••" required={!editingId} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Role / Hak Akses</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })} className="input-base">
                  <option value="KARYAWAN">Karyawan</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR">HR</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Jabatan</label>
                <input type="text" value={formData.jabatan} onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })} className="input-base" placeholder="Jabatan..." />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Departemen</label>
                <select value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })} className="input-base">
                  <option value="">Pilih departemen</option>
                  {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Shift Kerja</label>
                <select value={formData.shiftId} onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })} className="input-base">
                  <option value="">Pilih shift</option>
                  {shifts?.map((s: any) => <option key={s.id} value={s.id}>{s.nama} ({s.jamMasuk} - {s.jamKeluar})</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2" style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}>
              {editingId ? "Simpan Perubahan" : "Tambah Karyawan"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Table Card ──────────────────────────────────────────── */}
      <div className="card-base overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <h3 className="font-bold text-base text-[hsl(var(--foreground))]">Daftar Staf Karyawan</h3>
          {karyawan?.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
              {karyawan.length} staf
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.5]">
                <th className="py-3.5 px-6 table-header">Karyawan</th>
                <th className="py-3.5 px-4 table-header">Email / Telp</th>
                <th className="py-3.5 px-4 table-header">Departemen</th>
                <th className="py-3.5 px-4 table-header">Shift</th>
                <th className="py-3.5 px-4 table-header">Role</th>
                <th className="py-3.5 px-4 table-header">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[hsl(var(--muted-fg))]">Memuat data karyawan...</td>
                </tr>
              ) : karyawan?.length > 0 ? (
                karyawan.map((k: any) => (
                  <tr key={k.id} className="border-b border-[hsl(var(--border))/0.5] hover:bg-[hsl(var(--muted))/0.3] transition-colors">
                    <td className="py-3.5 px-6 font-semibold">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {k.nama?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{k.nama}</p>
                          <p className="text-[11px] text-[hsl(var(--muted-fg))] font-mono">{k.nomorInduk}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-medium">{k.email}</p>
                      <p className="text-[11px] text-[hsl(var(--muted-fg))]">{k.noTelpon || "-"}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">{k.department?.nama || "-"}</td>
                    <td className="py-3.5 px-4 text-xs font-medium">{k.shift?.nama || "-"}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
                        {getRoleLabel(k.role)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(k)} className="text-xs font-semibold text-indigo-500 hover:underline">Edit</button>
                        <button onClick={() => deleteMutation.mutate(k.id)} className="text-xs font-semibold text-red-500 hover:underline">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[hsl(var(--muted-fg))]">Belum ada data karyawan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
