import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // StayFinder brand — a warm "sunset coral", deliberately distinct from
        // Airbnb's exact Rausch while keeping the warm travel feel.
        brand: {
          DEFAULT: "#E8505B",
          dark: "#CC3A46",
          light: "#F2787F",
          tint: "#FDECEE",
        },
        ink: {
          DEFAULT: "#222222",
          muted: "#6A6A6A",
          subtle: "#949494",
        },
        hairline: "#DDDDDD",
        divider: "#EBEBEB",
        surface: "#F7F7F7",
      },
      maxWidth: {
        content: "1280px",
        wide: "2080px",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 6px 16px rgba(0,0,0,0.12)",
        soft: "0 2px 8px rgba(0,0,0,0.08)",
        pill: "0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        "pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        pop: "pop 0.25s ease-in-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
