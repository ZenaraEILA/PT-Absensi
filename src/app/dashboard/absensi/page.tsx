"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatTime, cn, getStatusColor, isWithinRadius, calculateDistance } from "@/lib/utils";
import toast from "react-hot-toast";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AbsensiPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "SUPER_ADMIN" || role === "HR" || role === "MANAGER";
  const queryClient = useQueryClient();
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [viewingFoto, setViewingFoto] = useState<{ id: string; type: "checkIn" | "checkOut" } | null>(null);
  const [fotoData, setFotoData] = useState<string | null>(null);
  const [fotoLoading, setFotoLoading] = useState(false);
  const [verifikasiModal, setVerifikasiModal] = useState<{
    open: boolean;
    attendanceId: string;
    nama: string;
    currentVerifikasi?: string | null;
    currentCatatan?: string | null;
  }>({ open: false, attendanceId: "", nama: "" });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isInAllowedArea, setIsInAllowedArea] = useState(false);
  const [nearestLocation, setNearestLocation] = useState<string | null>(null);
  const [nearestDistance, setNearestDistance] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: todayAttendance, isLoading: isLoadingToday } = useQuery({
    queryKey: ["my-attendance-today"],
    queryFn: async () => {
      const res = await fetch("/api/absensi/hari-ini");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: attendanceHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["my-attendance-history"],
    queryFn: async () => {
      const res = await fetch("/api/absensi/riwayat");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: allTodayAttendance, isLoading: isLoadingAllToday } = useQuery({
    queryKey: ["all-attendance-today"],
    queryFn: async () => {
      const res = await fetch("/api/absensi/semua");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const { data: activeLocations } = useQuery({
    queryKey: ["active-locations"],
    queryFn: async () => {
      const res = await fetch("/api/lokasi/aktif");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  useEffect(() => {
    if (location && activeLocations?.length > 0) {
      const inAnyRadius = activeLocations.some((loc: any) =>
        isWithinRadius(location.lat, location.lng, loc.latitude, loc.longitude, loc.radius)
      );
      setIsInAllowedArea(inAnyRadius);
      if (!inAnyRadius) {
        let minDist = Infinity;
        let nearest: string | null = null;
        for (const loc of activeLocations) {
          const d = calculateDistance(location.lat, location.lng, loc.latitude, loc.longitude);
          if (d < minDist) { minDist = d; nearest = loc.nama; }
        }
        setNearestLocation(nearest);
        setNearestDistance(minDist === Infinity ? null : Math.round(minDist));
      } else {
        setNearestLocation(null);
        setNearestDistance(null);
      }
    } else if (activeLocations?.length === 0) {
      setIsInAllowedArea(true);
      setNearestLocation(null);
      setNearestDistance(null);
    } else {
      setIsInAllowedArea(false);
      setNearestLocation(null);
      setNearestDistance(null);
    }
  }, [location, activeLocations]);

  const getLocation = useCallback(() => {
    if (!("geolocation" in navigator)) { setLocationError("GPS tidak didukung browser ini."); return; }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
        setLocationLoading(false);
      },
      () => {
        setLocationError("GPS tidak aktif. Silakan aktifkan GPS dan coba lagi.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    getLocation();
    return () => { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); } };
  }, [getLocation]);

  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) { videoRef.current.srcObject = streamRef.current; }
  }, [showCamera]);

  const startCamera = async () => {
    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = mediaStream;
      setShowCamera(true);
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = mediaStream; } });
    } catch {
      toast.error("Kamera tidak dapat diakses. Periksa izin kamera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const MAX_W = 480; const MAX_H = 360;
      let w = video.videoWidth || 640; let h = video.videoHeight || 480;
      if (w > h) { if (w > MAX_W) { h = Math.round((h * MAX_W) / w); w = MAX_W; } }
      else { if (h > MAX_H) { w = Math.round((w * MAX_H) / h); h = MAX_H; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")?.drawImage(video, 0, 0, w, h);
      setPhoto(canvas.toDataURL("image/jpeg", 0.5));
      stopCamera();
    }
  };

  const checkinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/absensi/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foto: photo, lat: location?.lat, lng: location?.lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal check-in");
      return data;
    },
    onSuccess: () => {
      toast.success("Check-in berhasil!");
      queryClient.invalidateQueries({ queryKey: ["my-attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance-history"] });
      setPhoto(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/absensi/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foto: photo, lat: location?.lat, lng: location?.lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal check-out");
      return data;
    },
    onSuccess: () => {
      toast.success("Check-out berhasil!");
      queryClient.invalidateQueries({ queryKey: ["my-attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance-history"] });
      setPhoto(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const verifikasiMutation = useMutation({
    mutationFn: async ({ attendanceId, verifikasi, catatan }: { attendanceId: string; verifikasi: string; catatan: string }) => {
      const res = await fetch(`/api/absensi/${attendanceId}/verifikasi`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifikasi, catatan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal verifikasi");
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success("Verifikasi berhasil: " + (variables.verifikasi === "AMAN" ? "Aman" : "Berbohong"));
      queryClient.invalidateQueries({ queryKey: ["all-attendance-today"] });
      setVerifikasiModal({ open: false, attendanceId: "", nama: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isCheckedIn = !!todayAttendance?.checkIn;
  const isCheckedOut = !!todayAttendance?.checkOut;
  const showCheckin = !isCheckedIn;
  const showCheckout = isCheckedIn && !isCheckedOut;

  const viewFoto = (attendanceId: string, type: "checkIn" | "checkOut") => {
    setFotoData(null);
    setViewingFoto({ id: attendanceId, type });
    setFotoLoading(true);
    fetch(`/api/absensi/foto/${attendanceId}`)
      .then((r) => r.json())
      .then((d) => { setFotoData(type === "checkIn" ? d.fotoCheckIn : d.fotoCheckOut); setFotoLoading(false); })
      .catch(() => { setFotoLoading(false); toast.error("Gagal memuat foto"); });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
            Absensi <span className="gradient-text">Harian</span>
          </h1>
          <p className="text-sm text-[hsl(var(--muted-fg))] mt-1">{formatDate(new Date().toISOString())}</p>
        </div>
        {location && (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            GPS Aktif
          </span>
        )}
      </div>

      {/* ── Main Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Check-in / Check-out Card ───────────────────────── */}
        <div className="lg:col-span-1">
          <div className="card-base p-6 space-y-4 shadow-lg">
            {/* Icon + Title */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl",
                showCheckin ? "bg-emerald-500/10" : showCheckout ? "bg-red-500/10" : "bg-blue-500/10"
              )}>
                {showCheckin ? "🟢" : showCheckout ? "🔴" : "✅"}
              </div>
              <h2 className="text-xl font-extrabold text-[hsl(var(--foreground))]">
                {showCheckin ? "Check In" : showCheckout ? "Check Out" : "Selesai"}
              </h2>
              <p className="text-xs text-[hsl(var(--muted-fg))]">
                {showCheckin ? "Catat kehadiran masuk kamu" : showCheckout ? "Catat kehadiran pulang kamu" : "Absensi hari ini telah selesai"}
              </p>
            </div>

            {/* Today status */}
            {!isLoadingToday && todayAttendance && (
              <div className="rounded-xl bg-[hsl(var(--muted))] p-4 space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[hsl(var(--muted-fg))]">Check In</span>
                  <span className="font-mono font-bold text-blue-500">{todayAttendance.checkIn ? formatTime(todayAttendance.checkIn) : "-"}</span>
                </div>
                <div className="h-px bg-[hsl(var(--border))]" />
                <div className="flex justify-between items-center">
                  <span className="text-[hsl(var(--muted-fg))]">Check Out</span>
                  <span className="font-mono font-bold text-orange-500">{todayAttendance.checkOut ? formatTime(todayAttendance.checkOut) : "-"}</span>
                </div>
                <div className="h-px bg-[hsl(var(--border))]" />
                <div className="flex justify-between items-center">
                  <span className="text-[hsl(var(--muted-fg))]">Status</span>
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", getStatusColor(todayAttendance.status))}>{todayAttendance.status}</span>
                </div>
                {todayAttendance.verifikasi && (
                  <>
                    <div className="h-px bg-[hsl(var(--border))]" />
                    <div className="flex justify-between items-center">
                      <span className="text-[hsl(var(--muted-fg))]">Verifikasi</span>
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", todayAttendance.verifikasi === "AMAN" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                        {todayAttendance.verifikasi === "AMAN" ? "✅ Aman" : "⚠️ Berbohong"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {!isLoadingToday && !todayAttendance && (
              <div className="text-center py-6 rounded-xl border border-dashed border-[hsl(var(--border))]">
                <div className="text-3xl mb-2">🕐</div>
                <p className="text-sm text-[hsl(var(--muted-fg))]">Belum ada absensi hari ini</p>
              </div>
            )}

            {/* Location status */}
            {locationLoading && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-500/10 text-blue-500 text-xs font-medium">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                Mendeteksi lokasi GPS...
              </div>
            )}
            {locationError && (
              <div className="px-3 py-2.5 rounded-xl bg-amber-500/10 text-amber-500 text-xs">
                <p>{locationError}</p>
                <button onClick={getLocation} className="underline font-semibold mt-1">Coba lagi</button>
              </div>
            )}
            {location && !locationLoading && (
              <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium",
                isInAllowedArea ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
              )}>
                <div>
                  <p>{isInAllowedArea ? "✅ Di area yang diizinkan" : "❌ Di luar area absensi"}</p>
                  {!isInAllowedArea && nearestLocation && (
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Terdekat: {nearestLocation}{nearestDistance !== null && ` (~${nearestDistance}m)`}
                    </p>
                  )}
                </div>
                <button onClick={getLocation} title="Perbarui lokasi" className="text-lg opacity-70 hover:opacity-100">↻</button>
              </div>
            )}

            {/* Camera area */}
            <AnimatePresence>
              {!showCamera && !photo && (showCheckin || showCheckout) && (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={startCamera}
                  className="w-full py-3.5 rounded-xl border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  <span className="text-lg">📷</span> Ambil Foto Selfie
                </motion.button>
              )}
            </AnimatePresence>

            {showCamera && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="relative bg-black rounded-xl overflow-hidden shadow-lg">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                    <div className="w-14 h-14 rounded-full border-4 border-white/60 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border-2 border-white/80" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={capturePhoto} className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}>
                    📸 Jepret
                  </button>
                  <button onClick={stopCamera} className="flex-1 py-3 rounded-xl text-sm font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-fg))] hover:bg-[hsl(var(--border))] transition">
                    ✕ Batal
                  </button>
                </div>
              </motion.div>
            )}

            {photo && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="relative rounded-xl overflow-hidden shadow-md">
                  <img src={photo} alt="Selfie" className="w-full rounded-xl" />
                  <span className="absolute top-2 right-2 text-xs px-2 py-1 bg-emerald-500/80 text-white rounded-full font-medium backdrop-blur-sm">✓ Terambil</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setPhoto(null); startCamera(); }} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[hsl(var(--muted))] text-[hsl(var(--muted-fg))] hover:bg-[hsl(var(--border))] transition">🔄 Ulangi</button>
                  <button onClick={() => setPhoto(null)} className="py-2.5 px-4 rounded-xl text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition">✕ Hapus</button>
                </div>
              </motion.div>
            )}

            {!photo && !showCamera && (showCheckin || showCheckout) && (
              <p className="text-xs text-amber-500 text-center flex items-center justify-center gap-1.5">
                ⚠️ Ambil foto selfie untuk melakukan absensi
              </p>
            )}

            {/* Action Buttons */}
            {showCheckin && (
              <button
                onClick={() => checkinMutation.mutate()}
                disabled={checkinMutation.isPending || !photo || !location || !isInAllowedArea}
                className="w-full py-3.5 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 15px rgba(16,185,129,0.3)" }}
              >
                {checkinMutation.isPending ? (<><div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />Memproses...</>) : "✅ Check In Sekarang"}
              </button>
            )}

            {showCheckout && (
              <button
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending || !photo || !location || !isInAllowedArea}
                className="w-full py-3.5 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 15px rgba(239,68,68,0.3)" }}
              >
                {checkoutMutation.isPending ? (<><div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />Memproses...</>) : "🚪 Check Out Sekarang"}
              </button>
            )}

            {!photo && !showCamera && (showCheckin || showCheckout) && !location && (
              <div className="text-xs text-center text-[hsl(var(--muted-fg))] flex items-center justify-center gap-1.5">
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Tunggu deteksi lokasi selesai...
              </div>
            )}

            {isCheckedOut && (
              <div className="text-center py-5 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))" }}>
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-emerald-500 font-extrabold text-lg">Absensi Selesai!</p>
                <p className="text-emerald-500/70 text-xs mt-1">Sampai jumpa besok 👋</p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {/* ── Attendance History ───────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="card-base overflow-hidden shadow-lg h-full">
            <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <h2 className="font-bold text-base text-[hsl(var(--foreground))]">Riwayat Absensi Saya</h2>
              {attendanceHistory?.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500">{attendanceHistory.length} data</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.5]">
                    <th className="py-3.5 px-6 table-header">Tanggal</th>
                    <th className="py-3.5 px-3 table-header">Masuk</th>
                    <th className="py-3.5 px-3 table-header">Pulang</th>
                    <th className="py-3.5 px-3 table-header">Status</th>
                    <th className="py-3.5 px-3 table-header">Keterangan</th>
                    <th className="py-3.5 px-3 table-header text-center">Foto</th>
                    <th className="py-3.5 px-3 table-header text-center">Verif</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingHistory ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-[hsl(var(--border))/0.5]">
                        <td className="py-3.5 px-6"><div className="h-3.5 rounded-lg bg-[hsl(var(--muted))] w-28" /></td>
                        <td className="py-3.5 px-3"><div className="h-3.5 rounded-lg bg-[hsl(var(--muted))] w-16" /></td>
                        <td className="py-3.5 px-3"><div className="h-3.5 rounded-lg bg-[hsl(var(--muted))] w-16" /></td>
                        <td className="py-3.5 px-3"><div className="h-5 rounded-full bg-[hsl(var(--muted))] w-20" /></td>
                        <td className="py-3.5 px-3"><div className="h-3.5 rounded-lg bg-[hsl(var(--muted))] w-20" /></td>
                        <td className="py-3.5 px-3"><div className="h-3.5 rounded-lg bg-[hsl(var(--muted))] w-16 mx-auto" /></td>
                        <td className="py-3.5 px-3"><div className="h-3.5 rounded-lg bg-[hsl(var(--muted))] w-12 mx-auto" /></td>
                      </tr>
                    ))
                  ) : attendanceHistory?.length > 0 ? (
                    attendanceHistory.map((att: any) => (
                      <tr key={att.id} className="border-b border-[hsl(var(--border))/0.5] hover:bg-[hsl(var(--muted))/0.3] transition-colors">
                        <td className="py-3.5 px-6 font-semibold whitespace-nowrap text-sm">{formatDate(att.tanggal)}</td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-blue-500 text-xs">{att.checkIn ? formatTime(att.checkIn) : <span className="text-[hsl(var(--muted-fg))]">-</span>}</span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-orange-500 text-xs">{att.checkOut ? formatTime(att.checkOut) : <span className="text-[hsl(var(--muted-fg))]">-</span>}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", getStatusColor(att.status))}>{att.status}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          {att.keterangan ? (
                            <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded truncate inline-block max-w-[120px]" title={att.keterangan}>{att.keterangan}</span>
                          ) : <span className="text-xs text-[hsl(var(--muted-fg))]">-</span>}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {att.fotoCheckIn && (
                              <button onClick={() => viewFoto(att.id, "checkIn")} className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-xs font-semibold">Masuk</button>
                            )}
                            {att.fotoCheckOut && (
                              <button onClick={() => viewFoto(att.id, "checkOut")} className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 text-xs font-semibold">Pulang</button>
                            )}
                            {!att.fotoCheckIn && !att.fotoCheckOut && <span className="text-xs text-[hsl(var(--muted-fg))]">-</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {att.verifikasi ? (
                            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold", att.verifikasi === "AMAN" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", att.verifikasi === "AMAN" ? "bg-emerald-500" : "bg-red-500")} />
                              {att.verifikasi === "AMAN" ? "Aman" : "Bohong"}
                            </span>
                          ) : <span className="text-xs text-[hsl(var(--muted-fg))]">-</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[hsl(var(--muted-fg))]">
                        <div className="text-3xl mb-3">📋</div>
                        <p className="text-sm">Belum ada data absensi</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin: All Employees Today ───────────────────────────── */}
      {isAdmin && (
        <div className="card-base overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
            <h2 className="font-bold text-base text-[hsl(var(--foreground))]">Absensi Karyawan Hari Ini</h2>
            {allTodayAttendance?.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500">{allTodayAttendance.length} karyawan</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.5]">
                  <th className="py-3.5 px-6 table-header">Karyawan</th>
                  <th className="py-3.5 px-3 table-header">Departemen</th>
                  <th className="py-3.5 px-3 table-header">Masuk</th>
                  <th className="py-3.5 px-3 table-header">Pulang</th>
                  <th className="py-3.5 px-3 table-header">Status</th>
                  <th className="py-3.5 px-3 table-header">Ket.</th>
                  <th className="py-3.5 px-3 table-header text-center">Foto</th>
                  <th className="py-3.5 px-3 table-header text-center">Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingAllToday ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[hsl(var(--muted-fg))]">Memuat data...</td>
                  </tr>
                ) : allTodayAttendance && allTodayAttendance.length > 0 ? (
                  allTodayAttendance.map((emp: any) => (
                    <tr key={emp.id} className="border-b border-[hsl(var(--border))/0.5] hover:bg-[hsl(var(--muted))/0.3] transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {emp.nama?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{emp.nama}</p>
                            <p className="text-[11px] text-[hsl(var(--muted-fg))] font-mono">{emp.nomorInduk}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-xs bg-[hsl(var(--muted))] px-2 py-0.5 rounded">{emp.departemen || "-"}</span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-blue-500">{emp.attendance?.checkIn ? formatTime(emp.attendance.checkIn) : <span className="text-[hsl(var(--muted-fg))]">-</span>}</span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-orange-500">{emp.attendance?.checkOut ? formatTime(emp.attendance.checkOut) : <span className="text-[hsl(var(--muted-fg))]">-</span>}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        {emp.attendance ? (
                          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", getStatusColor(emp.attendance.status))}>{emp.attendance.status}</span>
                        ) : (
                          <span className="text-xs text-[hsl(var(--muted-fg))] bg-[hsl(var(--muted))] px-2.5 py-1 rounded-full">Belum absen</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {emp.attendance?.keterangan ? (
                          <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded truncate inline-block max-w-[100px]" title={emp.attendance.keterangan}>{emp.attendance.keterangan}</span>
                        ) : <span className="text-xs text-[hsl(var(--muted-fg))]">-</span>}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {emp.attendance?.hasFotoCheckIn && (
                            <button onClick={() => viewFoto(emp.attendance.id, "checkIn")} className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-xs font-semibold">Masuk</button>
                          )}
                          {emp.attendance?.hasFotoCheckOut && (
                            <button onClick={() => viewFoto(emp.attendance.id, "checkOut")} className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 text-xs font-semibold">Pulang</button>
                          )}
                          {!emp.attendance?.hasFotoCheckIn && !emp.attendance?.hasFotoCheckOut && <span className="text-xs text-[hsl(var(--muted-fg))]">-</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {emp.attendance ? (
                          <div className="flex flex-col items-center gap-2">
                            {emp.attendance.verifikasi ? (
                              <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold", emp.attendance.verifikasi === "AMAN" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", emp.attendance.verifikasi === "AMAN" ? "bg-emerald-500" : "bg-red-500")} />
                                {emp.attendance.verifikasi === "AMAN" ? "Aman" : "Berbohong"}
                              </span>
                            ) : (
                              <span className="text-xs text-[hsl(var(--muted-fg))] bg-[hsl(var(--muted))] px-2.5 py-1 rounded-full">Belum diverifikasi</span>
                            )}
                            <button
                              onClick={() => setVerifikasiModal({ open: true, attendanceId: emp.attendance.id, nama: emp.nama, currentVerifikasi: emp.attendance.verifikasi, currentCatatan: emp.attendance.catatanVerifikasi })}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                              style={{ background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))" }}
                            >
                              {emp.attendance.verifikasi ? "✏️ Ubah" : "🔍 Verifikasi"}
                            </button>
                          </div>
                        ) : <span className="text-xs text-[hsl(var(--muted-fg))]">-</span>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[hsl(var(--muted-fg))]">
                      <div className="text-3xl mb-3">📋</div>
                      <p className="text-sm">Belum ada data absensi hari ini</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Verifikasi ──────────────────────────────────── */}
      <AnimatePresence>
        {verifikasiModal.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setVerifikasiModal({ open: false, attendanceId: "", nama: "" })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="card-base relative max-w-md w-full shadow-2xl overflow-hidden border-indigo-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-[hsl(var(--foreground))]">🔍 Verifikasi Absensi</h3>
                  <p className="text-sm text-[hsl(var(--muted-fg))]">{verifikasiModal.nama}</p>
                </div>
                <button onClick={() => setVerifikasiModal({ open: false, attendanceId: "", nama: "" })} className="text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] transition p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-[hsl(var(--muted-fg))] bg-[hsl(var(--muted))] rounded-xl px-4 py-3">
                  Apakah absensi <strong className="text-[hsl(var(--foreground))]">{verifikasiModal.nama}</strong> dilakukan sendiri oleh yang bersangkutan?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => verifikasiMutation.mutate({ attendanceId: verifikasiModal.attendanceId, verifikasi: "AMAN", catatan: "" })}
                    disabled={verifikasiMutation.isPending}
                    className="py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 15px rgba(16,185,129,0.25)" }}
                  >
                    {verifikasiMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "✅ Aman"}
                  </button>
                  <button
                    onClick={() => verifikasiMutation.mutate({ attendanceId: verifikasiModal.attendanceId, verifikasi: "BERBOHONG", catatan: "" })}
                    disabled={verifikasiMutation.isPending}
                    className="py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 15px rgba(239,68,68,0.25)" }}
                  >
                    {verifikasiMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "⚠️ Berbohong"}
                  </button>
                </div>
                {verifikasiModal.currentVerifikasi && (
                  <div className="rounded-xl bg-[hsl(var(--muted))] px-4 py-3">
                    <p className="text-xs text-[hsl(var(--muted-fg))] uppercase tracking-wider mb-2 font-semibold">Hasil Sebelumnya</p>
                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold", verifikasiModal.currentVerifikasi === "AMAN" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", verifikasiModal.currentVerifikasi === "AMAN" ? "bg-emerald-500" : "bg-red-500")} />
                      {verifikasiModal.currentVerifikasi === "AMAN" ? "Aman" : "Berbohong"}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Foto ───────────────────────────────────────── */}
      <AnimatePresence>
        {viewingFoto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => { setViewingFoto(null); setFotoData(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="card-base relative max-w-lg w-full shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm", viewingFoto.type === "checkIn" ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500")}>📷</div>
                  <div>
                    <h3 className="font-bold text-sm text-[hsl(var(--foreground))]">Foto {viewingFoto.type === "checkIn" ? "Check In" : "Check Out"}</h3>
                    <p className="text-[11px] text-[hsl(var(--muted-fg))]">{viewingFoto.type === "checkIn" ? "Saat masuk kerja" : "Saat pulang kerja"}</p>
                  </div>
                </div>
                <button onClick={() => { setViewingFoto(null); setFotoData(null); }} className="text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {fotoLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-sm text-[hsl(var(--muted-fg))]">Memuat foto...</span>
                </div>
              ) : fotoData ? (
                <div className="bg-[hsl(var(--muted))]">
                  <img src={fotoData} alt="Foto absensi" className="w-full h-auto object-contain max-h-[70vh]" />
                </div>
              ) : (
                <div className="text-center py-20 text-[hsl(var(--muted-fg))]">
                  <div className="text-5xl mb-4">📷</div>
                  <p className="text-sm font-medium">Foto tidak tersedia</p>
                  <p className="text-xs mt-1 opacity-70">Karyawan tidak mengambil foto selfie</p>
                </div>
              )}
              {fotoData && (
                <div className="flex justify-end px-5 py-3 border-t border-[hsl(var(--border))]">
                  <button onClick={() => { setViewingFoto(null); setFotoData(null); }} className="text-xs font-semibold text-[hsl(var(--muted-fg))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] px-4 py-2 rounded-xl transition">Tutup</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
