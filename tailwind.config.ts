import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: "#FFD1DC",
          mint: "#B5EAD7",
          blue: "#C7CEEA",
          lemon: "#FFF5BA",
        },
      },
    },
  },
  plugins: [],
};
export default config;
