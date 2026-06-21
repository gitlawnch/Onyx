import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1180px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          lime: "#B9FF4A",
          cream: "#EDE3C7",
          dark: "#060805",
          darkAlt: "#10130D",
          violet: "#B9FF4A",
          blue: "#9FE83D",
          cyan: "#EDE3C7",
        },
        status: {
          ongoing: "#B9FF4A",
          ended: "#F87171",
          upcoming: "#EDE3C7",
          unknown: "#FBBF24",
        },
        risk: {
          low: "#B9FF4A",
          medium: "#FBBF24",
          high: "#F87171",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-saira)", "system-ui", "sans-serif"],
        display: ["var(--font-clash)", "var(--font-saira)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg,#B9FF4A 0%,#9FE83D 50%,#EDE3C7 100%)",
        "brand-text":
          "linear-gradient(105deg,#EDE3C7 0%,#B9FF4A 55%,#EDE3C7 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-dot": {
          "50%": { opacity: "0.4" },
        },
        "border-flow": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.3s ease-out",
        "accordion-up": "accordion-up 0.3s ease-out",
        shimmer: "shimmer 1.6s infinite",
        "pulse-dot": "pulse-dot 2s infinite",
        float: "float 6s ease-in-out infinite",
        "border-flow": "border-flow 4s ease infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;





