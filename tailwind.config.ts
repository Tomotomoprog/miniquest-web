import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        dim: "#64748b",
        line: "#e5e7eb",
        brand: {
          50:  "#f5fbff",
          100: "#e6f3ff",
          200: "#cfe8ff",
          400: "#7aa8ff",
          500: "#3b82f6",
          600: "#2563eb",
        },
      },
      boxShadow: {
        card: "0 1px 1px rgba(2,6,23,0.04), 0 8px 24px rgba(2,6,23,0.06)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
export default config;
