import { requiereRol } from "@/lib/sesion";
import { db } from "@/lib/db";
import { confirmacionAbierta, edicionActual, resultadosPublicados } from "@/lib/edicion";
import { correoConfigurado, recordatorioConfirmacion } from "@/lib/correo";
import { seleccionadas } from "@/lib/confirmaciones";
import { nombreDePila } from "@/lib/constantes";
import { diasPara, fecha, fechaCorta, fechaHora } from "@/lib/fechas";
import { Etiqueta, Tarjeta, Titulo, Vacio } from "@/components/ui";
import { GestorConfirmaciones } from "./gestor";

export const metadata = { title: "Confirmaciones · Administración ANUIES4MX" };

type Detalle = {
  total?: number;
  enviados?: number;
  fallidos?: string[];
  omitidos?: number;
  para?: string;
  ok?: boolean;
};

export default async function Confirmaciones() {
  const actor = await requiereRol("admin");
  const edicion = await edicionActual();
  const filas = await seleccionadas();

  const pendientes = filas.filter((f) => f.estado === "pendiente");

  const previa = recordatorioConfirmacion({
    nombre: pendientes[0] ? nombreDePila(pendientes[0].nombre) : "Ana Sofía",
    cierra: edicion.confirmacionCierra,
    eventoInicia: edicion.eventoInicia,
    eventoTermina: edicion.eventoTermina,
  });

  const historial = await db.auditLog.findMany({
    where: {
      accion: { in: ["confirmacion.recordatorio.envio", "confirmacion.recordatorio.prueba"] },
    },
    orderBy: { creadoEn: "desc" },
    take: 15,
    include: { actor: { select: { nombre: true } } },
  });
  const ultimo = historial.find((h) => h.accion === "confirmacion.recordatorio.envio");

  const publicados = resultadosPublicados(edicion);

  return (
    <div className="max-w-[1140px] px-8 pb-16 pt-10">
      <Etiqueta className="tracking-[0.14em]">
        Seleccionadas · Confirmación {fechaCorta(edicion.confirmacionAbre)} —{" "}
        {fechaCorta(edicion.confirmacionCierra)}
      </Etiqueta>
      <Titulo className="mb-6 mt-1.5 text-[40px]">Confirmaciones</Titulo>

      {!publicados || filas.length === 0 ? (
        <Vacio
          titulo="Todavía no hay seleccionadas"
          detalle="Esta sección se llena cuando se publican los resultados con aplicantes en dictamen de seleccionada."
        />
      ) : (
        <GestorConfirmaciones
          correoActor={actor.email}
          configurado={correoConfigurado()}
          abierta={confirmacionAbierta(edicion)}
          antes={new Date() < edicion.confirmacionAbre}
          cierra={fechaCorta(edicion.confirmacionCierra)}
          horaCierre={fecha(edicion.confirmacionCierra, "HH:mm")}
          dias={diasPara(edicion.confirmacionCierra)}
          ultimoEnvio={ultimo ? fechaHora(ultimo.creadoEn) : null}
          previa={previa}
          filas={filas.map((f) => ({
            folio: f.folio,
            nombre: f.nombre,
            email: f.email,
            universidad: f.universidad,
            estado: f.estado,
            respondido: f.respondidoEn ? fechaHora(f.respondidoEn) : null,
            ciudad: f.ciudadOrigen,
            talla: f.tallaPlayera,
            alimentos: f.requerimientosAlimentarios,
            emergencia: f.contactoEmergencia,
          }))}
        />
      )}

      <Tarjeta className="mt-6">
        <Etiqueta className="mb-4">Historial de recordatorios</Etiqueta>
        {historial.length === 0 ? (
          <p className="text-[13px] text-gris">Todavía no se ha enviado ningún recordatorio de confirmación.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-fondo">
                  {["Fecha", "Tipo", "Quién", "Resultado"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="border-b border-linea px-4 py-3 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-gris"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => {
                  const d = (h.detalle ?? {}) as Detalle;
                  const prueba = h.accion === "confirmacion.recordatorio.prueba";
                  return (
                    <tr key={h.id} className="border-b border-linea align-top">
                      <td className="px-4 py-3 font-mono text-[11px] text-gris">{fechaHora(h.creadoEn)}</td>
                      <td className="px-4 py-3">{prueba ? "Prueba" : "Envío a pendientes"}</td>
                      <td className="px-4 py-3 text-gris">{h.actor?.nombre ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[11.5px]">
                        {prueba ? (
                          `${d.ok ? "Enviada" : "Falló"} · ${d.para}`
                        ) : (
                          <>
                            {d.enviados ?? 0} de {d.total ?? 0} enviados
                            {d.omitidos ? ` · ${d.omitidos} ya habían respondido` : ""}
                            {d.fallidos?.length ? (
                              <div className="mt-1 text-rosa-oscuro">Fallaron: {d.fallidos.join(", ")}</div>
                            ) : null}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
