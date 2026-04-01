/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0b0f",
        panel: "#111217",
        panel2: "#171923",
        text: "#f3f4f6",
        muted: "#9ca3af",
        border: "rgba(255,255,255,0.08)",
        accent: "#6366f1",
      },
    },
  },
  plugins: [],
};