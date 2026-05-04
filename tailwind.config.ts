import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f6fc",
          100: "#dbeafe",
          200: "#bfdbfe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#1f4e79",
          700: "#163d61",
          800: "#0f2f4a",
          900: "#0a2236",
          950: "#061626",
        },
        sand: "#f5f0e6",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(10,34,54,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
