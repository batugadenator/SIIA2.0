/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dsgov: {
          primary: "#1351B4",
          secondary: "#2670E8",
          "blue-warm-vivid-70": "#1351B4",
          "blue-warm-vivid-60": "#2670E8",
          "blue-warm-vivid-50": "#5992ED",
          "gray-90": "#1B1B1B",
          "gray-60": "#555555",
          "gray-20": "#D8D8D8",
          "gray-5": "#F8F8F8",
          background: "#F8F8F8",
          text: "#111111",
          border: "#D8D8D8",
          success: "#168821",
          warning: "#FFCD07",
          danger: "#E52207"
        },
        semantic: {
          brand: "#1351B4",
          brandHover: "#0F3E8E",
          infoBg: "#E7F1FF",
          successBg: "#E6F6EC",
          warningBg: "#FFF4E5"
        }
      },
      fontFamily: {
        sans: ["Noto Sans", "Segoe UI", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};
