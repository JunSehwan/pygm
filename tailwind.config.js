/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./node_modules/flowbite-react/**/*.js",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    fontFamily: {
      sans: ["Noto Sans KR", "Montserrat"],
      serif: ["Lato"],
      mono: ["Corinthia", "Shadows Into Light", "Staatliches"],
      cursive: ["Architects Daughter"],
      jua: ["Jua"],
    },
    extend: {
      colors: {
        charming: {
          primary: "#ff4d5e",
          primaryDeep: "#ff3b30",
          lavender: "#7b6cf6",
          lavenderSoft: "#f3f0ff",
          surface: "#f6f6f8",
          surfaceStrong: "#ececf1",
          ink: "#111111",
          sub: "#6b7280",
          line: "#d9d9de",
        },
      },
      boxShadow: {
        charming: "0 4px 9px rgba(123,108,246,0.10)",
        "charming-soft": "0 2px 2px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};