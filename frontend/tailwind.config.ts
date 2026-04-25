import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
        ],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(17, 24, 39, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
