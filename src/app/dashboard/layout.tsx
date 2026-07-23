"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-4">
          {/* Premium spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
            <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-violet-500 animate-spin" style={{ animationDuration: "0.8s", animationDirection: "reverse" }} />
          </div>
          <p className="text-sm text-[hsl(var(--muted-fg))] animate-pulse">Memuat...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex relative overflow-hidden">

      {/* ── Ambient mesh background ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none select-none" aria-hidden="true">
        {/* Orb 1 – top right */}
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.06] dark:opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, hsl(243 75% 59%), transparent 70%)",
          }}
        />
        {/* Orb 2 – bottom left */}
        <div
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.05] dark:opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, hsl(270 70% 60%), transparent 70%)",
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 dark:opacity-[0.4] opacity-[0.3]"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <Sidebar />

      <main className="flex-1 lg:ml-64 min-w-0 p-4 lg:p-8 pt-16 lg:pt-8 relative">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
