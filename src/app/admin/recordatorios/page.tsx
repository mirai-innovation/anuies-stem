import { requiereRol } from "@/lib/sesion";
import { db } from "@/lib/db";
import { edicionActual, recepcionAbierta } from "@/lib/edicion";
import { correoConfigurado, recordatorioCierre } from "@/lib/correo";
import { destinatariasRecordatorio } from "@/lib/recordatorios";
import { diasPara, fecha, fechaCorta, fechaHora } from "@/lib/fechas";
import { Etiqueta, Tarjeta, Titulo } from "@/components/ui";
import { GestorRecordatorios } from "./gestor";

export const metadata = { title: "Recordatorios · Administración ANUIES4MX" };

type Detalle = {
  total?: number;
  enviados?: number;
  fallidos?: string[];
  omitidos?: number;
  para?: string;
  variante?: string;
  ok?: boolean;
};

export default async function Recordatorios() {
  const actor = await requiereRol("admin");
  const edicion = await edicionActual();
  const { destinatarias, sinVerificar } = await destinatariasRecordatorio();

  const conBorrador = destinatarias.filter((d) => d.faltantes !== null);
  const sinIniciar = destinatarias.filter((d) => d.faltantes === null);

  // Las vistas previas usan datos de ejemplo; el HTML es el mismo que reciben.
  const ejemplo = conBorrador[0];
  const previas = {
    borrador: recordatorioCierre({
      nombre: ejemplo?.nombre ?? "Ana Sofía",
      cierre: edicion.cierreRecepcion,
      faltantes: ejemplo?.faltantes ?? ["Completa la propuesta del paso 2."],
    }),
    sin_iniciar: recordatorioCierre({
      nombre: sinIniciar[0]?.nombre ?? "Ana Sofía",
      cierre: edicion.cierreRecepcion,
      faltantes: null,
    }),
  };

  const historial = await db.auditLog.findMany({
    where: { accion: { in: ["recordatorio.envio", "recordatorio.prueba"] } },
    orderBy: { creadoEn: "desc" },
    take: 15,
    include: { actor: { select: { nombre: true } } },
  });

  const ultimo = historial.find((h) => h.accion === "recordatorio.envio");

  return (
    <div className="max-w-[1140px] px-8 pb-16 pt-10">
      <Etiqueta className="tracking-[0.14em]">Administración · Correo</Etiqueta>
      <Titulo className="mb-6 mt-1.5 text-[40px]">Recordatorio de cierre</Titulo>

      <GestorRecordatorios
        correoActor={actor.email}
        configurado={correoConfigurado()}
        abierta={recepcionAbierta(edicion)}
        cierre={fechaCorta(edicion.cierreRecepcion)}
        horaCierre={fecha(edicion.cierreRecepcion, "HH:mm")}
        dias={diasPara(edicion.cierreRecepcion)}
        ultimoEnvio={ultimo ? fechaHora(ultimo.creadoEn) : null}
        previas={previas}
        destinatarias={destinatarias.map((d) => ({
          nombre: d.nombre,
          email: d.email,
          folio: d.folio,
          faltan: d.faltantes?.length ?? null,
        }))}
        conteos={{
          borrador: conBorrador.length,
          sinIniciar: sinIniciar.length,
          sinVerificar,
        }}
      />

      <Tarjeta className="mt-6">
        <Etiqueta className="mb-4">Historial</Etiqueta>
        {historial.length === 0 ? (
          <p className="text-[13px] text-gris">Todavía no se ha enviado ningún recordatorio.</p>
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
                  const prueba = h.accion === "recordatorio.prueba";
                  return (
                    <tr key={h.id} className="border-b border-linea align-top">
                      <td className="px-4 py-3 font-mono text-[11px] text-gris">
                        {fechaHora(h.creadoEn)}
                      </td>
                      <td className="px-4 py-3">{prueba ? "Prueba" : "Envío a aplicantes"}</td>
                      <td className="px-4 py-3 text-gris">{h.actor?.nombre ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[11.5px]">
                        {prueba ? (
                          `${d.ok ? "Enviada" : "Falló"} · ${d.para}`
                        ) : (
                          <>
                            {d.enviados ?? 0} de {d.total ?? 0} enviados
                            {d.omitidos ? ` · ${d.omitidos} ya habían enviado` : ""}
                            {d.fallidos?.length ? (
                              <div className="mt-1 text-rosa-oscuro">
                                Fallaron: {d.fallidos.join(", ")}
                              </div>
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
