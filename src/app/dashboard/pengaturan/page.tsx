"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function PengaturanPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profil");

  const [profileForm, setProfileForm] = useState({
    nama: session?.user?.name || "",
    noTelpon: "",
    alamat: "",
  });

  const [passForm, setPassForm] = useState({
    passwordLama: "",
    passwordBaru: "",
    konfirmasiPassword: "",
  });

  const { data: profileData } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!session,
  });

  useEffect(() => {
    if (profileData) {
      setProfileForm({
        nama: profileData.nama || session?.user?.name || "",
        noTelpon: profileData.noTelpon || "",
        alamat: profileData.alamat || "",
      });
    }
  }, [profileData, session]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui profil");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Profil berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const changePassMutation = useMutation({
    mutationFn: async (data: typeof passForm) => {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengubah password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Password berhasil diubah!");
      setPassForm({ passwordLama: "", passwordBaru: "", konfirmasiPassword: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.passwordBaru !== passForm.konfirmasiPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    changePassMutation.mutate(passForm);
  };

  // ── Lokasi State ─────────────────────────────────────────
  const [lokasiForm, setLokasiForm] = useState({
    nama: "",
    latitude: "",
    longitude: "",
    radius: "100",
  });
  const [editingLokasiId, setEditingLokasiId] = useState<string | null>(null);
  const [showLokasiModal, setShowLokasiModal] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  function getCurrentLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("GPS tidak didukung browser ini.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLokasiForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        }));
        setGpsLoading(false);
        toast.success("Lokasi terdeteksi!");
      },
      () => {
        setGpsLoading(false);
        toast.error("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const { data: locations, isLoading: lokasiLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const res = await fetch("/api/lokasi");
      if (!res.ok) throw new Error("Gagal mengambil data lokasi");
      return res.json();
    },
  });

  const createLokasiMutation = useMutation({
    mutationFn: async (data: typeof lokasiForm) => {
      const res = await fetch("/api/lokasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: data.nama,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          radius: parseInt(data.radius),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menambah lokasi");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Lokasi berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      resetLokasiForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateLokasiMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: typeof lokasiForm;
    }) => {
      const res = await fetch(`/api/lokasi?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: data.nama,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          radius: parseInt(data.radius),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengupdate lokasi");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Lokasi berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      resetLokasiForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleLokasiMutation = useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
      const res = await fetch(`/api/lokasi?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengubah status lokasi");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Status lokasi diubah!");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteLokasiMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lokasi?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus lokasi");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Lokasi berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function resetLokasiForm() {
    setLokasiForm({ nama: "", latitude: "", longitude: "", radius: "100" });
    setEditingLokasiId(null);
    setShowLokasiModal(false);
  }

  function openEditLokasi(loc: any) {
    setLokasiForm({
      nama: loc.nama,
      latitude: String(loc.latitude),
      longitude: String(loc.longitude),
      radius: String(loc.radius),
    });
    setEditingLokasiId(loc.id);
    setShowLokasiModal(true);
  }

  const tabs = [
    { id: "profil", label: "Profil Saya", icon: "👤" },
    { id: "password", label: "Ubah Password", icon: "🔑" },
    { id: "lokasi", label: "Lokasi", icon: "📍" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-4xl"
    >
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
          Pengaturan <span className="gradient-text">Akun</span>
        </h1>
        <p className="text-sm text-[hsl(var(--muted-fg))] mt-1 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          Kelola profil pribadi dan keamanan sandi akun kamu
        </p>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-2 p-1.5 rounded-2xl card-base max-w-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-glow"
                : "text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────── */}
      {activeTab === "profil" && (
        <form onSubmit={handleProfileSubmit} className="card-base p-6 space-y-5 shadow-lg">
          <div className="flex items-center gap-4 pb-4 border-b border-[hsl(var(--border))]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-glow">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[hsl(var(--foreground))]">{session?.user?.name}</h3>
              <p className="text-xs text-[hsl(var(--muted-fg))] font-mono">{session?.user?.nomorInduk}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Nama Lengkap</label>
              <input type="text" value={profileForm.nama} onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })} className="input-base" required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Nomor Telepon</label>
              <input type="text" value={profileForm.noTelpon} onChange={(e) => setProfileForm({ ...profileForm, noTelpon: e.target.value })} className="input-base" placeholder="081234567890" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Alamat Tempat Tinggal</label>
              <textarea value={profileForm.alamat} onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })} rows={3} className="input-base" placeholder="Alamat lengkap..." />
            </div>
          </div>

          <button type="submit" disabled={updateProfileMutation.isPending} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]" style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}>
            {updateProfileMutation.isPending ? "Simpan..." : "Simpan Profil"}
          </button>
        </form>
      )}

      {activeTab === "password" && (
        <form onSubmit={handlePassSubmit} className="card-base p-6 space-y-5 shadow-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Password Lama</label>
              <input type="password" value={passForm.passwordLama} onChange={(e) => setPassForm({ ...passForm, passwordLama: e.target.value })} className="input-base" placeholder="••••••••" required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Password Baru</label>
              <input type="password" value={passForm.passwordBaru} onChange={(e) => setPassForm({ ...passForm, passwordBaru: e.target.value })} className="input-base" placeholder="••••••••" required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Konfirmasi Password Baru</label>
              <input type="password" value={passForm.konfirmasiPassword} onChange={(e) => setPassForm({ ...passForm, konfirmasiPassword: e.target.value })} className="input-base" placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" disabled={changePassMutation.isPending} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]" style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}>
            {changePassMutation.isPending ? "Memproses..." : "Ubah Password"}
          </button>
        </form>
      )}

      {/* ── Tab Lokasi ────────────────────────────────────────── */}
      {activeTab === "lokasi" && (
        <div className="space-y-5">
          {/* Header + Tombol Tambah */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-[hsl(var(--foreground))]">Lokasi Kantor</h3>
              <p className="text-xs text-[hsl(var(--muted-fg))]">Atur lokasi untuk validasi absensi GPS</p>
            </div>
            <button
              onClick={() => { resetLokasiForm(); setShowLokasiModal(true); }}
              className="px-4 py-2 rounded-xl font-bold text-xs text-white shadow-glow transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Tambah Lokasi
            </button>
          </div>

          {/* Loading / Daftar Lokasi */}
          {lokasiLoading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="card-base p-5 animate-pulse">
                  <div className="h-4 bg-[hsl(var(--border))] rounded w-1/3 mb-3" />
                  <div className="h-3 bg-[hsl(var(--border))] rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : locations?.length === 0 ? (
            <div className="card-base p-10 text-center">
              <span className="text-4xl">📍</span>
              <p className="mt-3 font-semibold text-[hsl(var(--foreground))]">Belum ada lokasi</p>
              <p className="text-xs text-[hsl(var(--muted-fg))] mt-1">Klik "Tambah Lokasi" untuk menambahkan lokasi kantor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations?.map((loc: any) => (
                <div key={loc.id} className="card-base p-5 flex items-start justify-between gap-4 shadow-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-bold text-[hsl(var(--foreground))] truncate">{loc.nama}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        loc.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {loc.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-[hsl(var(--muted-fg))]">
                      <span>📍 {loc.latitude}, {loc.longitude}</span>
                      <span>📏 Radius {loc.radius}m</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleLokasiMutation.mutate({ id: loc.id, isActive: !loc.isActive })}
                      className={`p-2 rounded-lg text-xs font-bold transition-all ${
                        loc.isActive
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                      title={loc.isActive ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {loc.isActive ? "⏸" : "▶"}
                    </button>
                    <button
                      onClick={() => openEditLokasi(loc)}
                      className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => { if (confirm("Hapus lokasi ini?")) deleteLokasiMutation.mutate(loc.id); }}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                      title="Hapus"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal Lokasi ─────────────────────────────────────── */}
      {showLokasiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-base p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="font-extrabold text-lg text-[hsl(var(--foreground))] mb-5">
              {editingLokasiId ? "Edit Lokasi" : "Tambah Lokasi Baru"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingLokasiId) {
                  updateLokasiMutation.mutate({ id: editingLokasiId, data: lokasiForm });
                } else {
                  createLokasiMutation.mutate(lokasiForm);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Nama Lokasi</label>
                <input type="text" value={lokasiForm.nama} onChange={(e) => setLokasiForm({ ...lokasiForm, nama: e.target.value })} className="input-base" placeholder="Kantor Pusat" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Latitude</label>
                  <input type="number" step="any" value={lokasiForm.latitude} onChange={(e) => setLokasiForm({ ...lokasiForm, latitude: e.target.value })} className="input-base" placeholder="-6.2088" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Longitude</label>
                  <input type="number" step="any" value={lokasiForm.longitude} onChange={(e) => setLokasiForm({ ...lokasiForm, longitude: e.target.value })} className="input-base" placeholder="106.8456" required />
                </div>
              </div>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gpsLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {gpsLoading ? (
                  <><div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Mendeteksi lokasi...</>
                ) : (
                  <><span>📍</span> Gunakan Lokasi Saat Ini</>
                )}
              </button>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))] mb-1.5">Radius (meter)</label>
                <input type="number" value={lokasiForm.radius} onChange={(e) => setLokasiForm({ ...lokasiForm, radius: e.target.value })} className="input-base" placeholder="100" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createLokasiMutation.isPending || updateLokasiMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white shadow-glow transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}
                >
                  {createLokasiMutation.isPending || updateLokasiMutation.isPending
                    ? "Menyimpan..."
                    : editingLokasiId
                    ? "Simpan Perubahan"
                    : "Tambah Lokasi"}
                </button>
                <button
                  type="button"
                  onClick={resetLokasiForm}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
