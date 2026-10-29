import type { Config } from "tailwindcss";

/**
 * Los colores salen de variables CSS (ver app/globals.css), asi el modo oscuro
 * se resuelve solo: las mismas clases (bg-card, text-ink...) cambian de valor.
 */
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        app: token("app"),
        card: token("card"),
        brand: token("brand"),
        danger: token("danger"),
        ok: token("ok"),
        warn: token("warn"),
      },
    },
  },
  plugins: [],
} satisfies Config;
