import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        maceio: {
          navy: "#14467C",
          deep: "#0B2B4F",
          blue: "#047BC1",
          orange: "#F7941D",
          sky: "#EAF3FB",
          mist: "#F5F8FC",
          ink: "#12263F",
          muted: "#5B6F86",
          line: "#DCE6F0",
        },
      },
      fontFamily: { sans: ["var(--font-jakarta)", "system-ui", "sans-serif"] },
      boxShadow: {
        card: "0 1px 2px rgba(20,70,124,.06), 0 8px 24px rgba(20,70,124,.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
