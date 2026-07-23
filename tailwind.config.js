/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        surface: {
          50:  "hsl(240 10% 98%)",
          100: "hsl(240 10% 95%)",
          800: "hsl(240 8% 12%)",
          850: "hsl(240 9% 9%)",
          900: "hsl(240 10% 6%)",
          950: "hsl(240 12% 4%)",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(99,102,241,0.3)" },
          "50%":       { boxShadow: "0 0 40px rgba(99,102,241,0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-6px)" },
        },
        "spin-slow": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "border-spin": {
          "0%":   { "--angle": "0deg" },
          "100%": { "--angle": "360deg" },
        },
        aurora: {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "dot-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":       { opacity: "0.5", transform: "scale(0.8)" },
        },
        "slide-down": {
          "0%":   { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up":        "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-up-slow":   "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in":        "fade-in 0.4s ease-out forwards",
        "scale-in":       "scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-left":  "slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer:          "shimmer 2s linear infinite",
        "glow-pulse":     "glow-pulse 2s ease-in-out infinite",
        float:            "float 3s ease-in-out infinite",
        "spin-slow":      "spin-slow 8s linear infinite",
        aurora:           "aurora 8s ease infinite",
        "dot-pulse":      "dot-pulse 1.5s ease-in-out infinite",
        "slide-down":     "slide-down 0.2s ease-out forwards",
      },
      boxShadow: {
        glow:      "0 0 20px rgba(99, 102, 241, 0.25)",
        "glow-lg": "0 0 40px rgba(99, 102, 241, 0.35)",
        "glow-sm": "0 0 10px rgba(99, 102, 241, 0.2)",
        glass:     "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
        premium:   "0 20px 60px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255,255,255,0.05)",
        card:      "0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.04)",
      },
      backgroundImage: {
        "gradient-radial":   "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-gradient":     "radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.15) 0px, transparent 50%), radial-gradient(at 97% 21%, hsla(262, 98%, 70%, 0.15) 0px, transparent 50%), radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 0.1) 0px, transparent 50%)",
        shimmer:             "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};
