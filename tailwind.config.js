/** @type {import('tailwindcss').Config} */


module.exports = {
  content: [
    "./node_modules/flowbite-react/**/*.js",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  // theme: {
  //   extend: {},
  // },
  theme: {
    //기본 폰트로 사용할 폰트들 기본설정해줌.
    fontFamily: {
      sans: ["Noto Sans KR", "Montserrat"],
      serif: ["Lato"],
      mono: ["Corinthia", "Shadows Into Light", "Staatliches"],
      cursive: ["Architects Daughter"],
      jua: ["Jua"],
    },
    extend: {},
  },
  plugins: [
    require("flowbite/plugin")
  ],
}
