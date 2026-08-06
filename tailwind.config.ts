import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101c26",
        ink2: "#16303a",
        steel: "#1f4b52",
        paper: "#e9edea",
        card: "#ffffff",
        stamp: "#a63a2e",
        brass: "#b8834a",
        success: "#3f7a5c",
        line: "#d7dcd6",
        muted: "#5c6b6f",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-plex-sans)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
