"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import { Wave } from "@/components/ui/wave";

export default function SignInPage() {
  const router    = useRouter();
  const [nomorInduk, setNomorInduk] = useState("");
  const [password, setPassword]     = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [showPass, setShowPass]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        nomorInduk,
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Nomor induk atau password salah.");
      } else {
        toast.success("Login berhasil!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[hsl(var(--background))]">

      {/* ── Wave background ────────────────────────── */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <Wave
          className="absolute inset-0 w-full h-full"
          speed={0.3}
          tiles={1.5}
          style={{ width: "100%", height: "100%" }}
        />
        {/* Overlay gradasi — solid di area card, transparan di tepi */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              "radial-gradient(ellipse 700px 500px at center, hsl(var(--background) / 0.98) 25%, transparent 75%)",
              "linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.7) 60%, hsl(var(--background)) 100%)",
            ].join(", "),
          }}
        />
      </div>

      {/* ── Login card ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md mx-4 z-10"
      >
        {/* Card glow */}
        <div
          className="absolute inset-0 rounded-3xl opacity-20 blur-xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(270 70% 60%))",
          }}
        />

        <div
          className="relative rounded-3xl border border-[hsl(var(--border))] overflow-hidden"
          style={{
            background: "hsl(var(--card))",
            boxShadow: "0 32px 80px rgba(0,0,0,0.32), 0 0 0 1px hsl(var(--border) / 0.4)",
          }}
        >
          {/* Top gradient stripe */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

          <div className="p-8 sm:p-10">
            {/* ── Logo ──────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: [0.16,1,0.3,1] }}
              className="text-center mb-8"
            >
              <div className="relative inline-flex">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
                AbsensiApp
              </h1>
              <p className="text-sm text-[hsl(var(--muted-fg))] mt-1.5">
                Sistem Absensi Perusahaan
              </p>
            </motion.div>

            {/* ── Form ──────────────────────────────────────────── */}
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: [0.16,1,0.3,1] }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Nomor Induk */}
              <div className="space-y-1.5 group">
                <label htmlFor="nomorInduk" className="block text-sm font-semibold text-[hsl(var(--foreground))] transition-all duration-300 group-focus-within:text-[hsl(var(--primary))] group-focus-within:translate-x-0.5">
                  Nomor Induk
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[hsl(var(--muted-fg))] transition-all duration-300 group-focus-within:text-[hsl(var(--primary))]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                    </svg>
                  </div>
                  <input
                    id="nomorInduk"
                    type="text"
                    value={nomorInduk}
                    onChange={(e) => setNomorInduk(e.target.value)}
                    className="input-base pl-14 pr-10 text-center transition-all duration-300 focus:border-[hsl(var(--primary))] focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] focus:bg-[hsl(var(--card))]"
                    placeholder="Masukkan nomor induk"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 group">
                <label htmlFor="password" className="block text-sm font-semibold text-[hsl(var(--foreground))] transition-all duration-300 group-focus-within:text-[hsl(var(--primary))] group-focus-within:translate-x-0.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[hsl(var(--muted-fg))] transition-all duration-300 group-focus-within:text-[hsl(var(--primary))]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pl-14 pr-10 text-center transition-all duration-300 focus:border-[hsl(var(--primary))] focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] focus:bg-[hsl(var(--card))]"
                    placeholder="Masukkan password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] transition-colors"
                    aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-3 px-4 rounded-xl font-bold text-sm text-white overflow-hidden
                           transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                           hover:scale-[1.01] active:scale-[0.99] mt-2"
                style={{
                  background: "linear-gradient(135deg, hsl(243 75% 59%), hsl(262 70% 58%))",
                  boxShadow: "0 8px 24px hsl(243 75% 59% / 0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />

                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Masuk ke Dashboard
                  </span>
                )}
              </button>
            </motion.form>
          </div>

          {/* Footer */}
          <div className="px-8 sm:px-10 pb-6 text-center">
            <p className="text-xs text-[hsl(var(--muted-fg))]">
              © {new Date().getFullYear()} AbsensiApp. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
