import type { Metadata } from "next";
import localFont from "next/font/local";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Big Shoulders (antes "Big Shoulders Display") se sirve desde el repo y no
// desde Google: Google entrega sus archivos con URLs sin extensión y
// next/font/google truena en el build ("Cannot read properties of null").
// Archivos tomados de @fontsource/big-shoulders, licencia OFL.
const titulo = localFont({
  src: [
    { path: "./fuentes/big-shoulders-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fuentes/big-shoulders-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fuentes/big-shoulders-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--fuente-titulo",
  display: "swap",
  fallback: ["Arial Narrow", "sans-serif"],
});

const texto = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--fuente-texto",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--fuente-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reto ANUIES4MX 2026 · Mujeres en STEM",
  description:
    "Plataforma de postulación y evaluación del Reto ANUIES4MX 2026: Negocios del Futuro con Tecnologías Emergentes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${titulo.variable} ${texto.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
