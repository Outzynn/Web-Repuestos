import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d1d1f",
        muted: "#86868b",
        line: "#e5e5ea",
        app: "#f2f2f7",
        brand: "#0071e3",
        danger: "#ff3b30",
        ok: "#34c759",
        warn: "#ff9500",
      },
    },
  },
  plugins: [],
} satisfies Config;
