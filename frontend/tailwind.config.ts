import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system extraído do material de campanha (image.png)
        azul: {
          DEFAULT: "#0C3AA0",
          50: "#eaf0ff",
          100: "#cddbff",
          300: "#6f95e8",
          500: "#1E5BD6",
          700: "#0C3AA0",
          900: "#06215C",
          950: "#03163f",
        },
        amarelo: {
          DEFAULT: "#FFCC00",
          400: "#FFD633",
          500: "#FFCC00",
          600: "#E6B400",
        },
        laranja: {
          DEFAULT: "#F26522",
          500: "#F26522",
          600: "#E24E14",
        },
        gelo: "#F4F6FB",
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial Black", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "Arial", "sans-serif"],
      },
      boxShadow: {
        bloco: "0 18px 40px -12px rgba(3, 22, 63, 0.45)",
        botao: "0 10px 25px -6px rgba(242, 101, 34, 0.55)",
      },
      keyframes: {
        "pulso-mic": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(242, 101, 34, 0.55)" },
          "50%": { boxShadow: "0 0 0 26px rgba(242, 101, 34, 0)" },
        },
      },
      animation: {
        "pulso-mic": "pulso-mic 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
