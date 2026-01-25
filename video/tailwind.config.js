/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#00d4ff",
        secondary: "#7c3aed",
        accent: "#10b981",
        background: "#0a0a0f",
        terminal: {
          bg: "#1e1e2e",
          text: "#cdd6f4",
          prompt: "#89b4fa",
          success: "#a6e3a1",
        },
        ide: {
          bg: "#1e1e1e",
          sidebar: "#252526",
          keyword: "#569cd6",
          string: "#ce9178",
          function: "#dcdcaa",
          comment: "#6a9955",
          type: "#4ec9b0",
          variable: "#9cdcfe",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
