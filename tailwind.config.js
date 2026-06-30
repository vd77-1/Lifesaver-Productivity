/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep space productivity palette
        void: "#080C14",
        ink: "#0F1623",
        slate: "#1A2236",
        mist: "#243047",
        // Neon signal colors
        pulse: "#00F5A0",      // main accent - electric mint
        warn: "#FF6B35",       // deadline warning - kinetic orange
        risk: "#FF2D55",       // at-risk - urgent red
        calm: "#4CC9F0",       // safe/done - sky blue
        glow: "#7B61FF",       // AI action - violet
        // Neutral
        fog: "#8892A4",
        cloud: "#C4CDD9",
        snow: "#EEF2F7",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(0,245,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,160,0.03) 1px, transparent 1px)",
        "glow-pulse": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,245,160,0.15), transparent)",
        "glow-warn": "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,107,53,0.12), transparent)",
      },
      backgroundSize: {
        "grid": "32px 32px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "glow-breathe": "glowBreathe 2s ease-in-out infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        glowBreathe: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(0,245,160,0.3)" },
          "50%": { boxShadow: "0 0 24px rgba(0,245,160,0.6)" },
        },
      },
      boxShadow: {
        "pulse-glow": "0 0 20px rgba(0,245,160,0.25)",
        "warn-glow": "0 0 20px rgba(255,107,53,0.25)",
        "risk-glow": "0 0 20px rgba(255,45,85,0.3)",
        "card": "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};
