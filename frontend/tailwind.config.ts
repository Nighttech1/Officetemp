import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#22C55E",
          hover: "#4ADE80",
          muted: "#14532D",
          ink: "#BBF7D0",
          glow: "#16A34A",
        },
        surface: {
          DEFAULT: "#09090B",
          card: "#18181B",
          muted: "#27272A",
        },
        ink: {
          DEFAULT: "#FAFAFA",
          soft: "#D4D4D8",
          muted: "#A1A1AA",
        },
        line: {
          DEFAULT: "#3F3F46",
          strong: "#52525B",
        },
        danger: {
          DEFAULT: "#F87171",
          soft: "rgba(248, 113, 113, 0.12)",
        },
        ok: {
          DEFAULT: "#4ADE80",
          soft: "rgba(74, 222, 128, 0.12)",
        },
        landing: {
          dark: "#0A0A0A",
          cream: "#F7F7F5",
          grey: "#E8E8E6",
          ink: "#111111",
          muted: "#8D8A83",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--color-ink-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        border: "var(--border)",
        ring: "var(--ring)",
      },
      zIndex: {
        base: "0",
        raised: "10",
      },
      fontFamily: {
        sans: [
          "Century Gothic",
          "CenturyGothic",
          "AppleGothic",
          "Futura",
          "Trebuchet MS",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Century Gothic",
          "CenturyGothic",
          "AppleGothic",
          "Futura",
          "Trebuchet MS",
          "Arial",
          "sans-serif",
        ],
        hero: [
          "Century Gothic",
          "CenturyGothic",
          "AppleGothic",
          "Futura",
          "Trebuchet MS",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        sm: ["0.9375rem", { lineHeight: "1.35rem" }], // 15px
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px
        lg: ["1.0625rem", { lineHeight: "1.55rem" }], // 17px
        xl: ["1.125rem", { lineHeight: "1.6rem" }], // 18px
        "2xl": ["1.125rem", { lineHeight: "1.6rem" }], // 18px cap
        "3xl": ["1.125rem", { lineHeight: "1.6rem" }],
        "4xl": ["1.125rem", { lineHeight: "1.6rem" }],
        "5xl": ["1.125rem", { lineHeight: "1.6rem" }],
        "6xl": ["1.125rem", { lineHeight: "1.6rem" }],
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
      boxShadow: {
        glow: "0 0 28px -4px rgba(45, 212, 191, 0.45)",
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
