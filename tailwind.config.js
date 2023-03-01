/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}", "./index.html"],
  plugins: [],
  theme: {
    extend: {
      colors: {
        primary: "#000000ef",
        secondary: "#323232",
        "accent-1": "#FF1E56",
        "accent-2": "#FFAC41",
        // "accent-2-dim": "hsl(6, 100%, 80%)",
      },
      fontFamily: {
        "fira-code": ["Fira Code", "monospace"],
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out",
        "fade-out": "fade-out ease-in forwards",
      },
      keyframes: {
        "fade-in": {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
        "fade-out": {
          from: {
            opacity: "1",
            top: "0",
          },
          to: {
            opacity: "0",
          },
        },
      },
    },
  },
};
