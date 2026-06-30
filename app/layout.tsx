import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeSaver — AI Productivity Companion",
  description: "Beat deadlines before they beat you. AI-powered planning, rescue mode, and smart scheduling.",
  keywords: ["productivity", "AI", "deadlines", "Gemini", "task manager"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void text-snow font-body antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1A2236",
              color: "#EEF2F7",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#00F5A0", secondary: "#1A2236" } },
            error: { iconTheme: { primary: "#FF2D55", secondary: "#1A2236" } },
          }}
        />
      </body>
    </html>
  );
}
