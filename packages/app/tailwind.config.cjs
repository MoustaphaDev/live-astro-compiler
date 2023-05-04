/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}", "./index.html"],
  plugins: [],
  theme: {
    extend: {
      colors: {
        primary: "#101010",
        secondary: "#323232",
        "accent-2": "#FFAC41",
      },
      fontFamily: {
        "fira-code": ["Fira Code", "monospace"],
        montserrat: ["Montserrat", "sans-serif"],
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out",
        "fade-out": "fade-out ease-in forwards",
        "spin-2": "spin-2 8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
      boxShadow: {
        custom: "5px 5px 15px 5px rgba(0,0,0,.2), 0px 10px 13px -7px #090909c7",
      },
      keyframes: {
        "spin-2": {
          "0%": {
            transform: "rotate(0deg)",
          },
          "50%": {
            transform: "rotate(720deg)",
          },
          "100%": {
            transform: "rotate(1440deg)",
          },
        },
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
          },
          to: {
            opacity: "0",
          },
        },
      },
    },
  },
};
