import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/sesion";
import { edicionActual } from "@/lib/edicion";
import { Portada } from "@/components/portada";

export const metadata: Metadata = {
  title: "Convocatoria ANUIES4MX 2026 · Mujeres en STEM",
  description:
    "Programa intensivo de cinco días en Valle de Bravo para mujeres en STEM que aspiran a fundar tech startups. Convocatoria abierta a estudiantes de universidades asociadas a la ANUIES.",
};

/** Página principal.
 *
 *  Es la convocatoria pública, y desde aquí se entra a registro o a iniciar
 *  sesión. A quien ya trae sesión se le manda a su panel: si tiene cuenta, lo
 *  que busca no es leer las bases otra vez. */
export default async function Inicio() {
  const usuario = await sesionActual();

  if (usuario) {
    if (usuario.rol === "admin") redirect("/admin");
    if (usuario.rol === "anuies") redirect("/aplicaciones");
    redirect("/dashboard");
  }

  const edicion = await edicionActual();
  return <Portada edicion={edicion} sesion={null} />;
}
