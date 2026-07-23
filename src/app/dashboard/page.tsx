"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Role } from "@/types";
import Link from "next/link";
import { cn, getStatusColor, formatDate, formatTime } from "@/lib/utils";
import { motion } from "framer-motion";

/* ── Animation helpers ───────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/* ── Stat colors map ─────────────────────────────────────────────────── */
const STAT_STYLES = {
  blue: {
    icon:       "from-blue-500 to-indigo-500",
    iconBg:     "bg-blue-500/10 dark:bg-blue-500/15",
    glow:       "group-hover:shadow-[0_0_24px_rgba(59,130,246,0.3)]",
    border:     "group-hover:border-blue-500/30",
    accent:     "text-blue-500",
  },
  green: {
    icon:       "from-emerald-500 to-green-500",
    iconBg:     "bg-emerald-500/10 dark:bg-emerald-500/15",
    glow:       "group-hover:shadow-[0_0_24px_rgba(16,185,129,0.3)]",
    border:     "group-hover:border-emerald-500/30",
    accent:     "text-emerald-500",
  },
  yellow: {
    icon:       "from-amber-500 to-orange-500",
    iconBg:     "bg-amber-500/10 dark:bg-amber-500/15",
    glow:       "group-hover:shadow-[0_0_24px_rgba(245,158,11,0.3)]",
    border:     "group-hover:border-amber-500/30",
    accent:     "text-amber-500",
  },
  red: {
    icon:       "from-red-500 to-rose-500",
    iconBg:     "bg-red-500/10 dark:bg-red-500/15",
    glow:       "group-hover:shadow-[0_0_24px_rgba(239,68,68,0.3)]",
    border:     "group-hover:border-red-500/30",
    accent:     "text-red-500",
  },
} as const;

type StatColor = keyof typeof STAT_STYLES;

/* ══════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;
  const isKaryawan = role === "KARYAWAN";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: recentAttendance } = useQuery({
    queryKey: ["recent-attendance"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/recent-attendance");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="skeleton h-8 w-64" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-base p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton h-8 w-16" />
                </div>
                <div className="skeleton w-12 h-12 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ── Page header ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
            Selamat datang,{" "}
            <span className="gradient-text">
              {session?.user?.name?.split(" ")[0] || "User"}
            </span>{" "}
            👋
          </h1>
          <p className="text-sm text-[hsl(var(--muted-fg))] mt-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>

        {/* Live clock badge */}
        <LiveClock />
      </motion.div>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <motion.div
        variants={container}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {!isKaryawan && (
          <StatCard
            title="Total Karyawan"
            value={stats?.totalKaryawan ?? 0}
            icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            color="blue"
            suffix="orang"
          />
        )}
        <StatCard
          title="Hadir Hari Ini"
          value={stats?.hadirHariIni ?? 0}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          color="green"
          suffix="orang"
        />
        <StatCard
          title="Terlambat"
          value={stats?.terlambatHariIni ?? 0}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          color="yellow"
          suffix="orang"
        />
        <StatCard
          title="Cuti Pending"
          value={stats?.cutiPending ?? 0}
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          color="red"
          suffix="pengajuan"
        />
      </motion.div>

      {/* ── Main content ────────────────────────────────────────── */}
      {isKaryawan ? (
        <EmployeeQuickActions />
      ) : (
        <motion.div variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RecentAttendanceCard attendance={recentAttendance} />
          <PendingLeavesCard leaves={stats?.pendingLeaves} />
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Live Clock ─────────────────────────────────────────────────────── */
function LiveClock() {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl card-base text-sm font-mono font-medium text-[hsl(var(--foreground))]">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-dot-pulse" />
      {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </div>
  );
}

/* ── StatCard ───────────────────────────────────────────────────────── */
function StatCard({
  title, value, icon, color, suffix,
}: {
  title: string;
  value: number;
  icon: string;
  color: StatColor;
  suffix?: string;
}) {
  const s = STAT_STYLES[color];

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "group card-base p-5 overflow-hidden relative transition-all duration-300",
        s.glow,
        s.border
      )}
    >
      {/* Subtle shimmer on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           style={{ background: "linear-gradient(105deg, transparent 40%, hsl(var(--foreground)/0.02) 50%, transparent 60%)" }} />

      <div className="flex items-center justify-between relative">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[hsl(var(--muted-fg))] uppercase tracking-wider">{title}</p>
          <p className={cn("text-3xl font-extrabold tracking-tight", s.accent)}>{value}</p>
          {suffix && (
            <p className="text-[11px] text-[hsl(var(--muted-fg))]">{suffix}</p>
          )}
        </div>

        <div className={cn("p-3 rounded-2xl", s.iconBg)}>
          <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm", s.icon)}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Recent Attendance Card ─────────────────────────────────────────── */
function RecentAttendanceCard({ attendance }: { attendance: any[] }) {
  return (
    <motion.div variants={fadeUp} className="card-base p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
          <h2 className="text-base font-bold text-[hsl(var(--foreground))]">Absensi Terbaru</h2>
        </div>
        <Link
          href="/dashboard/absensi"
          className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 font-semibold transition-colors flex items-center gap-1"
        >
          Lihat semua
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="space-y-1">
        {attendance?.length > 0 ? (
          attendance.slice(0, 5).map((att: any, idx: number) => (
            <motion.div
              key={att.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.35, ease: [0.16,1,0.3,1] }}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors -mx-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {att.user?.nama?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))] leading-tight">{att.user?.nama}</p>
                  <p className="text-[11px] text-[hsl(var(--muted-fg))]">{formatDate(att.tanggal)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={att.status} />
                {att.checkIn && (
                  <span className="text-[11px] text-[hsl(var(--muted-fg))] font-mono hidden sm:inline">
                    {formatTime(att.checkIn)}
                  </span>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <EmptyState icon="📋" message="Belum ada data absensi hari ini." />
        )}
      </div>
    </motion.div>
  );
}

/* ── Pending Leaves Card ────────────────────────────────────────────── */
function PendingLeavesCard({ leaves }: { leaves: any[] }) {
  return (
    <motion.div variants={fadeUp} className="card-base p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
          <h2 className="text-base font-bold text-[hsl(var(--foreground))]">Cuti Pending</h2>
        </div>
        <Link
          href="/dashboard/cuti"
          className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 font-semibold transition-colors flex items-center gap-1"
        >
          Lihat semua
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="space-y-1">
        {leaves?.length > 0 ? (
          leaves.slice(0, 5).map((leave: any, idx: number) => (
            <motion.div
              key={leave.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.35, ease: [0.16,1,0.3,1] }}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors -mx-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {leave.user?.nama?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))] leading-tight">{leave.user?.nama}</p>
                  <p className="text-[11px] text-[hsl(var(--muted-fg))] capitalize">
                    {leave.tipe.replace(/_/g, " ").toLowerCase()}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/cuti"
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors min-w-[60px] text-center"
              >
                Review
              </Link>
            </motion.div>
          ))
        ) : (
          <EmptyState icon="✅" message="Tidak ada pengajuan cuti pending." />
        )}
      </div>
    </motion.div>
  );
}

/* ── Employee Quick Actions ─────────────────────────────────────────── */
function EmployeeQuickActions() {
  const quickActions = [
    {
      href: "/dashboard/absensi",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "Absensi Hari Ini",
      desc: "Lakukan check-in dan check-out harian",
      from: "from-emerald-500", to: "to-green-400",
      bg: "from-emerald-500/5 to-transparent",
      border: "hover:border-emerald-500/30",
      glow: "hover:shadow-[0_0_24px_rgba(16,185,129,0.2)]",
    },
    {
      href: "/dashboard/cuti",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      title: "Pengajuan Cuti",
      desc: "Ajukan cuti atau izin tidak masuk",
      from: "from-amber-500", to: "to-orange-400",
      bg: "from-amber-500/5 to-transparent",
      border: "hover:border-amber-500/30",
      glow: "hover:shadow-[0_0_24px_rgba(245,158,11,0.2)]",
    },
    {
      href: "/dashboard/pkl-izin",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      title: "Izin PKL",
      desc: "Buat surat izin PKL atau kegiatan",
      from: "from-violet-500", to: "to-purple-400",
      bg: "from-violet-500/5 to-transparent",
      border: "hover:border-violet-500/30",
      glow: "hover:shadow-[0_0_24px_rgba(139,92,246,0.2)]",
    },
    {
      href: "/dashboard/laporan",
      icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      title: "Riwayat Absensi",
      desc: "Lihat rekap absensi dan riwayat kamu",
      from: "from-blue-500", to: "to-indigo-400",
      bg: "from-blue-500/5 to-transparent",
      border: "hover:border-blue-500/30",
      glow: "hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]",
    },
  ];

  return (
    <motion.div
      variants={container}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {quickActions.map((action, i) => (
        <motion.div key={action.href} variants={fadeUp}>
          <Link
            href={action.href}
            className={cn(
              "group card-base p-6 relative overflow-hidden block transition-all duration-300",
              action.border, action.glow
            )}
          >
            {/* Hover gradient sweep */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              action.bg
            )} />

            <div className="relative">
              <div className={cn(
                "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300",
                action.from, action.to
              )}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-[hsl(var(--foreground))] text-base leading-tight">
                {action.title}
              </h3>
              <p className="text-sm text-[hsl(var(--muted-fg))] mt-1 leading-relaxed">{action.desc}</p>
            </div>

            {/* Arrow */}
            <div className="absolute top-5 right-5 text-[hsl(var(--muted-fg))] opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ── Status Badge ────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    HADIR:     "badge badge-green",
    TERLAMBAT: "badge badge-amber",
    IZIN:      "badge badge-blue",
    SAKIT:     "badge badge-blue",
    ALPHA:     "badge badge-red",
    CUTI:      "badge badge-indigo",
    LIBUR:     "badge badge-gray",
  };
  return (
    <span className={cn(map[status] || "badge badge-gray")}>
      {status}
    </span>
  );
}

/* ── Empty State ─────────────────────────────────────────────────────── */
function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-[hsl(var(--muted-fg))]">
      <span className="text-3xl mb-3 opacity-60">{icon}</span>
      <p className="text-sm text-center">{message}</p>
    </div>
  );
}

/* React must be in scope for hooks in client components */
import React from "react";
