import { requiereRol } from "@/lib/sesion";
import { edicionActual, recepcionAbierta } from "@/lib/edicion";
import { Aviso, BotonEnlace, Etiqueta, Tarjeta, Titulo } from "@/components/ui";
import { fecha } from "@/lib/fechas";
import { aplicacionDe } from "../aplicacion-actual";

/** Guarda común a los cuatro pasos: aquí se decide si la aplicación es
 *  editable. Cada acción del servidor lo vuelve a comprobar por su cuenta. */
export default async function LayoutAplicacion({ children }: { children: React.ReactNode }) {
  const usuario = await requiereRol("applicant");
  const edicion = await edicionActual();
  const app = await aplicacionDe(usuario.id);
  const abierta = recepcionAbierta(edicion);

  if (!abierta || !app) {
    return (
      <div className="max-w-[1000px] px-8 pb-16 pt-10">
        <Etiqueta>Aplicación</Etiqueta>
        <Titulo className="mt-1.5 text-[40px]">Recepción cerrada</Titulo>
        <Tarjeta className="mt-6">
          <p className="max-w-[62ch] text-sm leading-relaxed text-gris">
            El periodo de recepción cerró el {fecha(edicion.cierreRecepcion)} a las 23:59 CST.
            Ya no es posible crear ni editar aplicaciones.
          </p>
          <BotonEnlace href="/dashboard" variante="secundario" className="mt-5">
            Ir a mi convocatoria
          </BotonEnlace>
        </Tarjeta>
      </div>
    );
  }

  if (app.estado !== "draft") {
    return (
      <div className="max-w-[1000px] px-8 pb-16 pt-10">
        <Etiqueta>Aplicación · {app.folio}</Etiqueta>
        <Titulo className="mt-1.5 text-[40px]">Tu aplicación ya fue enviada</Titulo>
        <div className="mt-6 max-w-[62ch]">
          <Aviso tono="exito">
            La enviaste el {fecha(app.enviadaEn)}. A partir del envío queda inmutable, así que
            esta sección ya no admite cambios.
          </Aviso>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <BotonEnlace href="/dashboard" variante="secundario">
            Ir a mi convocatoria
          </BotonEnlace>
          <BotonEnlace href="/resultado">Ver mi resultado</BotonEnlace>
        </div>
      </div>
    );
  }

  return <div className="max-w-[1000px] px-8 pb-16 pt-10">{children}</div>;
}
