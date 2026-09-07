import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/sesion";
import { edicionActual } from "@/lib/edicion";
import { ColumnaFormulario, PanelAcceso } from "../panel-lateral";
import { FormularioLogin } from "./formulario";

export const metadata = { title: "Iniciar sesión · Reto ANUIES4MX 2026" };

export default async function Login() {
  if (await sesionActual()) redirect("/");
  const edicion = await edicionActual();

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <PanelAcceso
        cierre={edicion.cierreRecepcion}
        eventoInicia={edicion.eventoInicia}
        eventoTermina={edicion.eventoTermina}
      />
      <ColumnaFormulario etiqueta="Acceso a la plataforma" titulo="Iniciar sesión">
        <FormularioLogin />
      </ColumnaFormulario>
    </main>
  );
}
