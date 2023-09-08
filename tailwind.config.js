import { nextui } from "@nextui-org/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        floatingOne: "floatingOne 12s infinite",
        floatingTwo: "floatingTwo 9s infinite",
        floatingThree: "floatingThree 15s infinite",
      },
      keyframes: {
        floatingOne: {
          "0%": { transform: "translateY(-30%)" },
          "50%": { transform: "translateY(10%)" },
          "100%": { transform: "translateY(-30%)" },
        },
        floatingTwo: {
          "0%": { transform: "translateY(0%)" },
          "50%": { transform: "translateY(20%)" },
          "100%": { transform: "translateY(0%)" },
        },
        floatingThree: {
          "0%": { transform: "translateY(40%)" },
          "50%": { transform: "translateY(10%)" },
          "100%": { transform: "translateY(40%)" },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
