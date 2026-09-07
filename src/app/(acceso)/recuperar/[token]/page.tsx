import { edicionActual } from "@/lib/edicion";
import { ColumnaFormulario, PanelAcceso } from "../../panel-lateral";
import { FormularioCambiar } from "../formulario";

export const metadata = { title: "Nueva contraseña · Reto ANUIES4MX 2026" };

export default async function CambiarPassword({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const edicion = await edicionActual();

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <PanelAcceso
        cierre={edicion.cierreRecepcion}
        eventoInicia={edicion.eventoInicia}
        eventoTermina={edicion.eventoTermina}
      />
      <ColumnaFormulario etiqueta="Acceso a la plataforma" titulo="Nueva contraseña">
        <FormularioCambiar token={token} />
      </ColumnaFormulario>
    </main>
  );
}
