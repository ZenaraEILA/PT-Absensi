"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          gutter={12}
          containerStyle={{ marginTop: 8 }}
          toastOptions={{
            duration: 4000,
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "14px",
              padding: "14px 18px",
              fontSize: "14px",
              fontWeight: 500,
              boxShadow: "0 8px 30px rgb(0 0 0 / 0.18), 0 2px 8px rgb(0 0 0 / 0.08)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
            },
            success: {
              duration: 3500,
              style: {
                border: "1px solid hsl(142 70% 45% / 0.25)",
                background: "hsl(142 70% 45% / 0.08)",
              },
              iconTheme: { primary: "hsl(142 70% 45%)", secondary: "hsl(0 0% 100%)" },
            },
            error: {
              duration: 4500,
              style: {
                border: "1px solid hsl(0 84% 60% / 0.25)",
                background: "hsl(0 84% 60% / 0.08)",
              },
              iconTheme: { primary: "hsl(0 84% 60%)", secondary: "hsl(0 0% 100%)" },
            },
            loading: {
              style: {
                border: "1px solid hsl(217 91% 60% / 0.25)",
                background: "hsl(217 91% 60% / 0.08)",
              },
              iconTheme: { primary: "hsl(217 91% 60%)", secondary: "hsl(0 0% 100%)" },
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
