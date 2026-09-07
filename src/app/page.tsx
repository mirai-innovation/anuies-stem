import { redirect } from "next/navigation";
import { requiereSesion } from "@/lib/sesion";

/** La raiz solo enruta: cada rol tiene su propia pantalla de inicio. */
export default async function Inicio() {
  const usuario = await requiereSesion();

  if (usuario.rol === "admin") redirect("/admin");
  if (usuario.rol === "anuies") redirect("/aplicaciones");
  redirect("/dashboard");
}
