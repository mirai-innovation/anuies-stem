import Link from "next/link";
import type { Rol } from "@prisma/client";
import { db } from "@/lib/db";
import { consultarAplicaciones, kpisLista, type FiltrosLista } from "@/lib/lista";
import { ESTADOS, ESTADOS_CERRADOS, ROLES, TECNOLOGIAS } from "@/lib/constantes";
import { Chip, Etiqueta, Tarjeta, Titulo, Vacio } from "@/components/ui";
import { Filtros } from "./filtros";
import { Paginacion } from "./paginacion";

/** Lista de aplicaciones. La comparten ANUIES y administración: la única
 *  diferencia es la columna de score IA y la etiqueta de solo lectura, así que
 *  no tiene sentido mantener dos pantallas casi iguales. */
export async function ListaAplicaciones({
  rol,
  filtros,
  base,
}: {
  rol: Rol;
  filtros: FiltrosLista;
  base: string;
}) {
  const esAdmin = rol === "admin";
  const [{ total, filas, pagina, paginas }, kpis, universidades] = await Promise.all([
    consultarAplicaciones(filtros, esAdmin),
    kpisLista(),
    db.universidad.findMany({ orderBy: { nombre: "asc" }, select: { id: true, siglas: true, nombre: true } }),
  ]);

  const tarjetas = [
    { label: "Recibidas", value: String(kpis.recibidas), note: "Aplicaciones enviadas" },
    // Solo administración ve el avance de lo que aún no se envía.
    ...(esAdmin
      ? [
          {
            label: "En progreso",
            value: String(kpis.enProgreso),
            note: "Borradores sin enviar",
          },
        ]
      : []),
    { label: "Evaluadas", value: String(kpis.evaluadas), note: `${kpis.recibidas - kpis.evaluadas} pendientes` },
    { label: "Seleccionadas", value: String(kpis.seleccionadas), note: "Dictamen favorable" },
    {
      label: "Promedio comité",
      value: kpis.promedio ? kpis.promedio.toFixed(2) : "—",
      note: "Sobre 5 puntos",
    },
  ];

  const consulta = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v) as [string, string][],
  );

  return (
    <div className="px-8 pb-16 pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Etiqueta className="tracking-[0.14em]">{ROLES[rol]} · Edición 2026</Etiqueta>
          <Titulo className="mt-1.5 text-[38px]">Aplicaciones</Titulo>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {rol === "anuies" && <Chip tono="teal">Solo lectura</Chip>}
          <a
            href={`/api/exportar?${consulta.toString()}`}
            className="inline-flex items-center border border-linea-fuerte bg-superficie px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-tinta no-underline hover:border-rosa hover:text-rosa hover:no-underline"
          >
            Exportar CSV
          </a>
        </div>
      </div>

      <div className="mb-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((k) => (
          <Tarjeta key={k.label} className="p-[18px]">
            <Etiqueta className="text-[9.5px]">{k.label}</Etiqueta>
            <div className="mt-2 font-titulo text-[34px] font-extrabold leading-none text-tinta">
              {k.value}
            </div>
            <div className="mt-1 font-mono text-[10.5px] text-rosa">{k.note}</div>
          </Tarjeta>
        ))}
      </div>

      <div className="border border-linea bg-superficie">
        <Filtros
          base={base}
          filtros={filtros}
          universidades={universidades}
          incluirBorradores={esAdmin}
        />

        {filas.length === 0 ? (
          <div className="p-6">
            <Vacio
              titulo="Sin resultados"
              detalle="Ninguna aplicación coincide con los filtros. Ajusta la búsqueda o límpialos."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-[13px]">
              <caption className="sr-only">
                Aplicaciones recibidas en la convocatoria 2026
              </caption>
              <thead>
                <tr className="bg-fondo">
                  {["Folio", "Aplicante", "Universidad", "Tecnología", "Prom."]
                    .concat(esAdmin ? ["IA"] : [])
                    .concat(["Comité", "Estado", ""])
                    .map((h, i) => (
                      <th
                        key={`${h}-${i}`}
                        scope="col"
                        className="border-b border-linea px-4 py-3 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-gris"
                      >
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((a) => {
                  const cerrado = ESTADOS_CERRADOS.includes(a.estado);
                  return (
                    <tr key={a.id} className="border-b border-linea hover:bg-fondo">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11.5px] text-gris">
                        {a.folio}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {a.datos?.nombreCompleto ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gris">
                        {a.universidad?.siglas ?? (
                          // Sin coincidencia con el catálogo: se muestra lo que
                          // escribió, señalado para que salte a la vista.
                          <span
                            title={a.academicos?.universidad ?? undefined}
                            className="block max-w-[180px] truncate text-rosa-oscuro"
                          >
                            {a.academicos?.universidad ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gris">
                        {a.propuesta?.tecnologia ? TECNOLOGIAS[a.propuesta.tecnologia] : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px]">
                        {a.academicos?.promedio?.toFixed(1) ?? "—"}
                      </td>
                      {esAdmin && (
                        <td className="px-4 py-3 font-mono text-[12px] text-teal">
                          {a.evaluacionIA?.estado === "ok" && a.evaluacionIA.scoreGlobal != null
                            ? a.evaluacionIA.scoreGlobal.toFixed(1)
                            : a.evaluacionIA?.estado === "pending"
                              ? "pend."
                              : "—"}
                        </td>
                      )}
                      <td className="px-4 py-3 font-mono text-[12px] font-semibold">
                        {a.puntajeComite?.toFixed(1) ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Chip tono={cerrado ? "teal" : "rosa"}>{ESTADOS[a.estado]}</Chip>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link
                          href={`${base}/${a.id}`}
                          className="inline-flex items-center border border-linea-fuerte px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-tinta no-underline hover:border-rosa hover:text-rosa hover:no-underline"
                        >
                          {esAdmin ? "Evaluar" : "Abrir"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Paginacion base={base} filtros={filtros} pagina={pagina} paginas={paginas} total={total} />
      </div>
    </div>
  );
}
