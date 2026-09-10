import Link from "next/link";
import { notFound } from "next/navigation";
import type { Rol } from "@prisma/client";
import { db } from "@/lib/db";
import {
  AREAS_STEM,
  CRITERIOS,
  DICTAMENES,
  DOCUMENTOS,
  ESTADOS,
  NIVELES,
  TECNOLOGIAS,
  VIDEOS,
} from "@/lib/constantes";
import { duracion, fechaCorta, pesoArchivo } from "@/lib/fechas";
import { Aviso, Chip, Etiqueta, Tarjeta, Titulo } from "@/components/ui";
import { PanelIA } from "./panel-ia";
import { FormularioEvaluacion } from "./formulario-evaluacion";

/** Detalle de una aplicación.
 *
 *  ANUIES y administración ven lo mismo salvo dos bloques: el panel de IA y el
 *  formulario de evaluación, que son exclusivos de administración. La decisión
 *  no se toma escondiendo nodos en el cliente: los datos de IA ni siquiera se
 *  consultan cuando el rol es ANUIES. */
export async function DetalleAplicacion({
  id,
  rol,
  usuarioId,
  base,
}: {
  id: string;
  rol: Rol;
  usuarioId: string;
  base: string;
}) {
  const esAdmin = rol === "admin";

  const app = await db.application.findUnique({
    where: { id },
    include: {
      universidad: true,
      user: { select: { email: true } },
      evaluaciones: {
        include: { evaluator: { select: { nombre: true, organizacion: true } } },
        orderBy: { creadaEn: "asc" },
      },
      // La evaluación por IA solo se lee si quien mira es administración.
      evaluacionIA: esAdmin,
    },
  });

  // El comité no ve lo que no se envió; administración sí, para seguir el
  // avance mientras la convocatoria está abierta.
  if (!app || (app.estado === "draft" && !esAdmin)) notFound();

  const esBorrador = app.estado === "draft";
  const video = app.videos.find((v) => v.tipo === "propuesta");
  const entregados = new Map(app.documentos.map((d) => [d.tipo, d]));
  const mia = app.evaluaciones.find((e) => e.evaluatorId === usuarioId);

  const promedioComite =
    app.evaluaciones.length > 0
      ? app.evaluaciones.reduce((a, e) => a + e.promedio, 0) / app.evaluaciones.length
      : null;

  const ficha = [
    app.academicos?.universidad ?? app.universidad?.nombre,
    app.academicos?.programaEducativo,
    app.academicos?.semestre ? `${app.academicos.semestre}º semestre` : null,
    app.academicos?.promedio != null ? `Promedio ${app.academicos.promedio.toFixed(1)}` : null,
    app.academicos?.nivel ? NIVELES[app.academicos.nivel] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="px-8 pb-16 pt-10">
      <Link
        href={base}
        className="mb-4 inline-block font-mono text-[11px] uppercase tracking-[0.08em] text-gris no-underline hover:text-rosa hover:no-underline"
      >
        ← Todas las aplicaciones
      </Link>

      {esBorrador && (
        <div className="mb-4 max-w-[74ch]">
          <Aviso tono="info">
            <strong>Borrador · aún no se envía.</strong> La aplicante todavía puede cambiar
            cualquier cosa, así que lo que ves aquí es un avance, no una postulación. No se puede
            evaluar hasta que la envíe.
          </Aviso>
        </div>
      )}

      {!app.universidadId && app.academicos?.universidad && (
        <div className="mb-4 max-w-[70ch]">
          <Aviso tono="info">
            La institución que escribió la aplicante no coincide con ninguna del catálogo ANUIES.
            No es motivo de rechazo, pero conviene verificarla contra la constancia.
          </Aviso>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="font-mono text-[11px] tracking-[0.08em] text-gris">
            {app.folio} ·{" "}
            {app.enviadaEn
              ? `enviada ${fechaCorta(app.enviadaEn)}`
              : `sin enviar · última edición ${fechaCorta(app.actualizadaEn)}`}
          </div>
          <Titulo className="mb-1 mt-1.5 text-[38px]">
            {app.datos?.nombreCompleto ?? "Sin nombre"}
          </Titulo>
          <div className="text-sm text-gris">{ficha || "Sin datos académicos"}</div>
        </div>

        <div className="flex flex-wrap gap-6">
          {esAdmin && (
            <div>
              <Etiqueta className="text-[9.5px]">Score IA</Etiqueta>
              <div className="font-titulo text-[38px] font-extrabold leading-none text-teal">
                {app.evaluacionIA?.estado === "ok" && app.evaluacionIA.scoreGlobal != null
                  ? app.evaluacionIA.scoreGlobal.toFixed(1)
                  : "—"}
              </div>
            </div>
          )}
          <div>
            <Etiqueta className="text-[9.5px]">Score comité</Etiqueta>
            <div className="font-titulo text-[38px] font-extrabold leading-none text-rosa">
              {promedioComite?.toFixed(1) ?? "—"}
            </div>
          </div>
          <div>
            <Etiqueta className="text-[9.5px]">Estado</Etiqueta>
            <div className="mt-2">
              <Chip tono={app.dictamen ? "teal" : "rosa"}>{ESTADOS[app.estado]}</Chip>
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="grid gap-6">
          {/* Los dos videos, en el orden en que se piden: el de presentación
              habla de la aplicante y el de propuesta, del proyecto. */}
          {VIDEOS.map((regla) => {
            const subido = app.videos.find((v) => v.tipo === regla.tipo);
            return (
              <Tarjeta key={regla.tipo}>
                <Etiqueta className="mb-4">
                  {regla.nombre}
                  {subido ? ` · ${duracion(subido.duracionSegundos)}` : ""}
                </Etiqueta>
                {subido ? (
                  // La fuente apunta a la ruta autorizada, que firma la URL en
                  // el momento: así el enlace del reproductor no sobrevive a la
                  // sesión.
                  <video
                    controls
                    preload="metadata"
                    className="aspect-video w-full bg-tinta"
                    src={`/archivo/aplicacion/${app.id}/video/${regla.tipo}`}
                  />
                ) : (
                  <div className="grid aspect-video w-full place-items-center bg-tinta">
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-gris-claro">
                      Sin {regla.nombre.toLowerCase()}
                    </span>
                  </div>
                )}
                {subido?.resumen && (
                  <p className="mt-3 text-[13px] leading-relaxed text-gris">{subido.resumen}</p>
                )}
              </Tarjeta>
            );
          })}

          <Tarjeta>
            <Etiqueta className="mb-4">Propuesta</Etiqueta>
            <div className="text-sm">
              <strong>{app.propuesta?.nombre ?? "Sin nombre"}</strong>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {app.propuesta?.tecnologia && <Chip>{TECNOLOGIAS[app.propuesta.tecnologia]}</Chip>}
              {app.academicos?.areaStem && (
                <Chip tono="teal">{AREAS_STEM[app.academicos.areaStem]}</Chip>
              )}
            </div>
          </Tarjeta>

          <Tarjeta>
            <Etiqueta className="mb-4">Documentos</Etiqueta>
            <div className="grid">
              {DOCUMENTOS.map((d) => {
                const sub = entregados.get(d.tipo);
                return (
                  <div
                    key={d.tipo}
                    className="flex items-center justify-between gap-3 border-b border-linea py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="text-[13.5px]">{d.nombre}</div>
                      {sub && (
                        <div className="mt-0.5 truncate font-mono text-[10.5px] text-gris">
                          {sub.nombreOriginal} · {pesoArchivo(sub.tamanoBytes)}
                        </div>
                      )}
                    </div>
                    {sub ? (
                      <a
                        href={`/archivo/aplicacion/${app.id}/documento/${d.tipo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-none font-mono text-[11px] uppercase tracking-[0.06em]"
                      >
                        Ver PDF
                      </a>
                    ) : (
                      <span className="flex-none font-mono text-[10px] uppercase tracking-[0.08em] text-rosa-oscuro">
                        No entregado
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Tarjeta>

          <Tarjeta>
            <Etiqueta className="mb-4">Propuesta escrita</Etiqueta>
            <Etiqueta className="text-[9.5px] text-rosa">Problema u oportunidad</Etiqueta>
            <p className="mb-4 mt-2 text-[13.5px] leading-relaxed text-tinta">
              {app.propuesta?.problema ?? "—"}
            </p>
            <Etiqueta className="text-[9.5px] text-rosa">Impacto social esperado</Etiqueta>
            <p className="mt-2 text-[13.5px] leading-relaxed text-tinta">
              {app.propuesta?.impacto ?? "—"}
            </p>
          </Tarjeta>
        </div>

        <div className="grid gap-6">
          {esAdmin && app.evaluacionIA && <PanelIA evaluacion={app.evaluacionIA} />}

          <Tarjeta>
            <Etiqueta className="mb-4">Calificaciones del comité</Etiqueta>
            {app.evaluaciones.length === 0 ? (
              <p className="text-[13px] text-gris">
                Todavía no hay evaluaciones registradas para esta aplicación.
              </p>
            ) : (
              <div className="grid">
                {app.evaluaciones.map((e) => (
                  <div key={e.id} className="border-b border-linea py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <div className="text-[13.5px] font-semibold">{e.evaluator.nombre}</div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-gris">
                          {e.evaluator.organizacion ?? "Comité"} · {DICTAMENES[e.dictamen]}
                        </div>
                      </div>
                      <span className="font-mono text-[15px] font-semibold text-rosa">
                        {e.promedio.toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-gris">{e.fortalezas}</p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-gris">
                      {e.areasOportunidad}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-baseline justify-between pt-4">
              <Etiqueta>Promedio comité</Etiqueta>
              <span className="font-titulo text-[28px] font-extrabold text-tinta">
                {promedioComite ? `${promedioComite.toFixed(1)} / 5` : "—"}
              </span>
            </div>
          </Tarjeta>

          {esAdmin && esBorrador ? (
            <Tarjeta tono="teal">
              <Etiqueta className="mb-3 text-teal-oscuro">Evaluación no disponible</Etiqueta>
              <p className="text-[13px] leading-relaxed text-tinta">
                Esta aplicación sigue en borrador. El formulario de evaluación se habilita cuando
                la aplicante la envíe: calificar un avance sería calificar algo que todavía va a
                cambiar.
              </p>
            </Tarjeta>
          ) : esAdmin ? (
            <FormularioEvaluacion
              applicationId={app.id}
              criterios={CRITERIOS.map((c) => ({ clave: c.clave, nombre: c.nombre }))}
              inicial={
                mia
                  ? {
                      criterios: mia.criterios,
                      fortalezas: mia.fortalezas,
                      areasOportunidad: mia.areasOportunidad,
                      dictamen: mia.dictamen,
                    }
                  : null
              }
            />
          ) : (
            <Tarjeta tono="teal">
              <Etiqueta className="mb-2.5 text-teal-oscuro">Acceso ANUIES</Etiqueta>
              <p className="m-0 text-[13px] leading-relaxed text-tinta">
                Este perfil consulta aplicaciones y calificaciones del comité. La evaluación por IA
                y la captura de puntajes corresponden al rol administrador.
              </p>
            </Tarjeta>
          )}
        </div>
      </div>
    </div>
  );
}
