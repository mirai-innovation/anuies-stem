import type { Metadata } from "next";
import { Big_Shoulders, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Google renombro la familia: lo que el diseno pide como "Big Shoulders
// Display" hoy se sirve como "Big Shoulders". Es la misma tipografia.
const titulo = Big_Shoulders({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--fuente-titulo",
  display: "swap",
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
