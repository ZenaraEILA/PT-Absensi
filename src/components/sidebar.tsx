"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn, getRoleLabel } from "@/lib/utils";
import { Role } from "@/types";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
  section: "main" | "admin";
}

function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg
      className={cn("w-[18px] h-[18px] flex-shrink-0", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  absensi: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  cuti: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  pkl: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  karyawan: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  shift: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  departemen: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  laporan: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  pengaturan: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
};

const navItems: NavItem[] = [
  { label: "Dashboard",  href: "/dashboard",             icon: <Icon path={ICONS.dashboard}  />, roles: ["SUPER_ADMIN","HR","MANAGER","KARYAWAN"], section: "main" },
  { label: "Absensi",    href: "/dashboard/absensi",     icon: <Icon path={ICONS.absensi}    />, roles: ["SUPER_ADMIN","HR","MANAGER","KARYAWAN"], section: "main" },
  { label: "Cuti",       href: "/dashboard/cuti",        icon: <Icon path={ICONS.cuti}       />, roles: ["SUPER_ADMIN","HR","MANAGER","KARYAWAN"], section: "main" },
  { label: "Izin PKL",   href: "/dashboard/pkl-izin",    icon: <Icon path={ICONS.pkl}        />, roles: ["SUPER_ADMIN","HR","MANAGER","KARYAWAN"], section: "main" },
  { label: "Karyawan",   href: "/dashboard/karyawan",    icon: <Icon path={ICONS.karyawan}   />, roles: ["SUPER_ADMIN","HR"],                       section: "admin" },
  { label: "Shift",      href: "/dashboard/shift",       icon: <Icon path={ICONS.shift}      />, roles: ["SUPER_ADMIN","HR"],                       section: "admin" },
  { label: "Departemen", href: "/dashboard/departemen",  icon: <Icon path={ICONS.departemen} />, roles: ["SUPER_ADMIN","HR"],                       section: "admin" },
  { label: "Laporan",    href: "/dashboard/laporan",     icon: <Icon path={ICONS.laporan}    />, roles: ["SUPER_ADMIN","HR","MANAGER"],              section: "admin" },
  { label: "Pengaturan", href: "/dashboard/pengaturan",  icon: <Icon path={ICONS.pengaturan} />, roles: ["SUPER_ADMIN","HR"],                       section: "admin" },
];

export default function Sidebar() {
  const pathname    = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userRole = session?.user?.role as Role | undefined;

  const filtered = navItems.filter((i) => userRole && i.roles.includes(userRole));
  const mainItems  = filtered.filter((i) => i.section === "main");
  const adminItems = filtered.filter((i) => i.section === "admin");

  const initial   = session?.user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      {/* ── Mobile overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile hamburger ────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
        className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-xl
                   bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-[var(--shadow-md)]
                   text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] transition-colors duration-200"
      >
        <motion.div animate={mobileOpen ? "open" : "closed"}>
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </motion.div>
      </button>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : undefined }}
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 flex flex-col",
          "bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))]",
          "transition-transform duration-300 ease-out lg:translate-x-0 shadow-[var(--shadow-xl)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top gradient accent */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="flex flex-col h-full relative">

          {/* ── Logo ─────────────────────────────────────────────── */}
          <div className="px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
            <Link href="/dashboard" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[hsl(var(--foreground))] tracking-tight leading-tight">AbsensiApp</p>
                <p className="text-[10px] text-[hsl(var(--muted-fg))] font-medium tracking-widest uppercase">
                  {userRole ? getRoleLabel(userRole) : "—"}
                </p>
              </div>
            </Link>
          </div>

          {/* ── Nav ──────────────────────────────────────────────── */}
          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">

            {/* Main section */}
            <NavSection label="Menu Utama" items={mainItems} pathname={pathname} onItemClick={() => setMobileOpen(false)} />

            {/* Admin section */}
            {adminItems.length > 0 && (
              <NavSection label="Manajemen" items={adminItems} pathname={pathname} onItemClick={() => setMobileOpen(false)} />
            )}
          </nav>

          {/* ── User footer ──────────────────────────────────────── */}
          <div className="px-3 py-4 border-t border-[hsl(var(--sidebar-border))]">
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors duration-200 group">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-glow-sm">
                  {initial}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[hsl(var(--sidebar))]" />
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate leading-tight">
                  {session?.user?.name || "Pengguna"}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-fg))] truncate font-mono leading-tight mt-0.5">
                  {session?.user?.nomorInduk || "—"}
                </p>
              </div>
              {/* Logout */}
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                title="Keluar"
                className="ml-auto p-1.5 rounded-lg text-[hsl(var(--muted-fg))] hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

/* ── NavSection ─────────────────────────────────────────────────────────── */
function NavSection({
  label,
  items,
  pathname,
  onItemClick,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onItemClick: () => void;
}) {
  return (
    <div className="space-y-0.5">
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-fg))/0.7]">
        {label}
      </p>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
              isActive
                ? "bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400"
                : "text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            )}
          >
            {/* Active indicator */}
            {isActive && (
              <motion.span
                layoutId="active-pill"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            {/* Icon */}
            <span className={cn(
              "flex-shrink-0 transition-colors duration-200",
              isActive ? "text-indigo-500 dark:text-indigo-400" : "text-[hsl(var(--muted-fg))] group-hover:text-[hsl(var(--foreground))]"
            )}>
              {item.icon}
            </span>

            <span className="flex-1 truncate">{item.label}</span>

            {/* Active dot */}
            {isActive && <span className="nav-dot flex-shrink-0" />}
          </Link>
        );
      })}
    </div>
  );
}
