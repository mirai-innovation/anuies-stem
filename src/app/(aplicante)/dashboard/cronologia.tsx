import type { Application, Edicion } from "@prisma/client";
import { DOCUMENTOS } from "@/lib/constantes";
import { fechaCorta } from "@/lib/fechas";

type Hito = { fecha: string; etapa: string; nota: string; hecho: boolean };

/** La cronologia se deriva del estado y de las fechas de la edicion, no de una
 *  lista guardada: asi no puede quedar desfasada de la aplicacion real. */
function hitos(app: Application, edicion: Edicion, publicados: boolean): Hito[] {
  const enviada = app.estado !== "draft";
  const ahora = new Date();
  const seleccionada = publicados && app.dictamen === "selected";
  const entregados = app.documentos.length;

  return [
    {
      fecha: fechaCorta(app.creadaEn),
      etapa: "Registro y borrador creado",
      nota: `Folio ${app.folio}`,
      hecho: true,
    },
    {
      fecha: enviada ? fechaCorta(app.enviadaEn) : fechaCorta(edicion.cierreRecepcion),
      etapa: enviada ? "Aplicación enviada" : "Envío de la aplicación",
      nota: enviada
        ? "Ya no puede editarse."
        : "Tienes hasta el cierre de recepción para enviarla.",
      hecho: enviada,
    },
    {
      fecha: `${fechaCorta(edicion.evaluacionInicia)} — ${fechaCorta(edicion.evaluacionTermina)}`,
      etapa: "Evaluación del comité",
      nota: "Cinco criterios en escala 1 a 5.",
      hecho: ahora > edicion.evaluacionTermina,
    },
    {
      fecha: fechaCorta(edicion.resultadosPublicadosEn ?? edicion.resultadosPrevistos),
      etapa: "Publicación de resultados",
      nota: publicados ? "Ya puedes consultar tu dictamen." : "Aún no se publican.",
      hecho: publicados,
    },
    {
      fecha: `${fechaCorta(edicion.confirmacionAbre)} — ${fechaCorta(edicion.confirmacionCierra)}`,
      etapa: "Confirmación de participación",
      nota: "Solo para quienes resulten seleccionadas.",
      hecho: app.confirmacion?.estado === "confirmada",
    },
    {
      fecha: `Hasta ${fechaCorta(edicion.eventoInicia)}`,
      etapa: "Integración de expediente",
      // Esta etapa está deliberadamente al final: los cinco documentos
      // oficiales solo se le piden a quien fue seleccionada, no a todas las
      // postulantes.
      nota: seleccionada
        ? entregados === DOCUMENTOS.length
          ? "Tus cinco documentos están entregados."
          : `Entregaste ${entregados} de ${DOCUMENTOS.length} documentos.`
        : "Solo para las aplicantes seleccionadas, después de los resultados.",
      hecho: seleccionada && entregados === DOCUMENTOS.length,
    },
    {
      fecha: `${fechaCorta(edicion.eventoInicia)} — ${fechaCorta(edicion.eventoTermina)}`,
      etapa: "Reto presencial y Demo Day",
      nota: "Centro de Capacitación ANUIES, Valle de Bravo.",
      hecho: ahora > edicion.eventoTermina,
    },
  ];
}

export function Cronologia({
  app,
  edicion,
  publicados,
}: {
  app: Application;
  edicion: Edicion;
  publicados: boolean;
}) {
  const lista = hitos(app, edicion, publicados);

  return (
    <ol className="m-0 grid list-none p-0">
      {lista.map((h, i) => (
        <li key={h.etapa} className="grid grid-cols-[14px_1fr] gap-3.5 pb-5">
          <div className="flex flex-col items-center gap-1">
            <span
              className={`size-[11px] flex-none ${
                h.hecho ? "bg-rosa" : "border border-linea-fuerte bg-superficie"
              }`}
            />
            {i < lista.length - 1 && <span className="min-h-[22px] w-px flex-1 bg-linea" />}
          </div>
          <div>
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-rosa">
              {h.fecha}
            </div>
            <div className="mt-0.5 text-[13.5px] font-medium">{h.etapa}</div>
            <div className="mt-0.5 text-[12.5px] text-gris">{h.nota}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
