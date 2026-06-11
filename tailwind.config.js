/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        olive: {
          50: "#F7F8F1",
          100: "#EDEEDC",
          200: "#D9DDB8",
          300: "#BDC48C",
          400: "#9EAA60",
          500: "#8B9A46",
          600: "#6F7F36",
          700: "#556B2F",
          800: "#455529",
          900: "#3A4725",
        },
        cream: {
          50: "#FDFCF9",
          100: "#FAF8F5",
          200: "#F5F0E6",
          300: "#EDE4D0",
          400: "#DDCFAE",
          500: "#C4A35A",
        },
        earth: {
          50: "#F7F3EF",
          100: "#EDE5DD",
          200: "#D8C8B8",
          300: "#BEA58C",
          400: "#9F7E5F",
          500: "#7D5A3C",
          600: "#62452D",
          700: "#4D3724",
          800: "#3E2723",
          900: "#2B1B17",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        natural: "0 2px 12px rgba(62, 39, 35, 0.08)",
        "natural-lg": "0 8px 24px rgba(62, 39, 35, 0.12)",
        paper: "inset 0 0 40px rgba(196, 163, 90, 0.05)",
      },
      backgroundImage: {
        "paper-texture":
          "radial-gradient(ellipse at 50% 0%, rgba(139, 154, 70, 0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(196, 163, 90, 0.05) 0%, transparent 50%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "glow-pulse": "glowPulse 1.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(139, 154, 70, 0.6)" },
          "50%": { transform: "scale(1.05)", boxShadow: "0 0 20px 8px rgba(139, 154, 70, 0.3)" },
          "100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(139, 154, 70, 0)" },
        },
      },
    },
  },
  plugins: [],
};
