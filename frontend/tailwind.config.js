export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF6EE", lav: { 100: "#EFE9FA", 300: "#D9CCF2", 600: "#7A62B8" },
        rose: { 100: "#FCE6EC", 300: "#F6C6D3", 600: "#C2477A" }, plum: "#2E2440",
      },
      fontFamily: { display: ["Fraunces", "Georgia", "serif"], sans: ["Nunito Sans", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
