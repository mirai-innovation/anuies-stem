import { redirect } from "next/navigation";
import { requiereSesion } from "@/lib/sesion";

/** La raíz solo enruta.
 *
 *  Sin sesión manda a iniciar sesión; con ella, a la pantalla que le toca al
 *  rol. La convocatoria pública se publica por fuera de la plataforma. */
export default async function Inicio() {
  const usuario = await requiereSesion();

  if (usuario.rol === "admin") redirect("/admin");
  if (usuario.rol === "anuies") redirect("/aplicaciones");
  redirect("/dashboard");
}
