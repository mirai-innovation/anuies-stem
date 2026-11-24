"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Dictamen } from "@prisma/client";
import { db } from "@/lib/db";
import { exigeRol } from "@/lib/sesion";
import { CLAVE_EDICION, edicionActual, resultadosPublicados } from "@/lib/edicion";
import { evaluarPendientes, iaConfigurada } from "@/lib/ia";
import { correoResultados } from "@/lib/correo";
import { CLAVES_CRITERIO } from "@/lib/constantes";
import { registrar } from "@/lib/bitacora";

export type EstadoEvaluacion = { ok?: boolean; error?: string; errores?: Record<string, string> };

const Esquema = z.object({
  applicationId: z.string().min(1),
  claridad: z.coerce.number().int().min(1).max(5),
  innovacion: z.coerce.number().int().min(1).max(5),
  impacto: z.coerce.number().int().min(1).max(5),
  viabilidad: z.coerce.number().int().min(1).max(5),
  presentacion: z.coerce.number().int().min(1).max(5),
  fortalezas: z.string().trim().min(1).max(2000),
  areasOportunidad: z.string().trim().min(1).max(2000),
  dictamen: z.enum(["selected", "waitlist", "rejected"]),
});

/** Recalcula el puntaje del comité y el promedio por criterio a partir de
 *  todas las evaluaciones humanas. El score de IA no entra en el cálculo: es
 *  informativo y nunca sustituye al humano. */
async function recalcular(applicationId: string) {
  const evs = await db.evaluation.findMany({ where: { applicationId } });
  if (evs.length === 0) return;

  const media = (f: (typeof evs)[number]["criterios"] extends infer C ? (c: C) => number : never) =>
    evs.reduce((a, e) => a + f(e.criterios), 0) / evs.length;

  const puntaje = evs.reduce((a, e) => a + e.promedio, 0) / evs.length;

  // El dictamen consolidado es el que más evaluadores eligieron; con empate
  // gana el más conservador, para no dar por seleccionada a quien el comité
  // no respaldó de forma clara.
  const orden: Dictamen[] = ["rejected", "waitlist", "selected"];
  const conteo = new Map<Dictamen, number>();
  for (const e of evs) conteo.set(e.dictamen, (conteo.get(e.dictamen) ?? 0) + 1);
  const dictamen = [...conteo.entries()].sort(
    (a, b) => b[1] - a[1] || orden.indexOf(a[0]) - orden.indexOf(b[0]),
  )[0][0];

  await db.application.update({
    where: { id: applicationId },
    data: {
      estado: "evaluated",
      puntajeComite: Number(puntaje.toFixed(2)),
      dictamen,
      criteriosComite: {
        claridad: Math.round(media((c) => c.claridad)),
        innovacion: Math.round(media((c) => c.innovacion)),
        impacto: Math.round(media((c) => c.impacto)),
        viabilidad: Math.round(media((c) => c.viabilidad)),
        presentacion: Math.round(media((c) => c.presentacion)),
      },
      // Lo que verá la aplicante se precarga con la evaluación más reciente y
      // queda editable hasta publicar.
      retroalimentacionPublicada: {
        fortalezas: evs[evs.length - 1].fortalezas,
        areasOportunidad: evs[evs.length - 1].areasOportunidad,
      },
    },
  });
}

export async function guardarEvaluacion(
  _previo: EstadoEvaluacion,
  datos: FormData,
): Promise<EstadoEvaluacion> {
  let usuario;
  try {
    usuario = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso para evaluar." };
  }

  const edicion = await edicionActual();
  // Después de publicar, los dictámenes quedan firmes: cambiarlos alteraría un
  // resultado que las aplicantes ya vieron.
  if (resultadosPublicados(edicion)) {
    return { error: "Los resultados ya se publicaron; las evaluaciones quedaron firmes." };
  }

  const parseo = Esquema.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    const errores: Record<string, string> = {};
    for (const i of parseo.error.issues) {
      const campo = String(i.path[0] ?? "general");
      errores[campo] ??=
        CLAVES_CRITERIO.includes(campo as never)
          ? "Asigna un puntaje del 1 al 5."
          : "Este campo es obligatorio.";
    }
    return { errores };
  }

  const d = parseo.data;
  const app = await db.application.findUnique({ where: { id: d.applicationId } });
  if (!app || app.estado === "draft") return { error: "La aplicación no está disponible." };

  const criterios = {
    claridad: d.claridad,
    innovacion: d.innovacion,
    impacto: d.impacto,
    viabilidad: d.viabilidad,
    presentacion: d.presentacion,
  };
  const promedio =
    Object.values(criterios).reduce((a, b) => a + b, 0) / Object.values(criterios).length;

  const previa = await db.evaluation.findUnique({
    where: { applicationId_evaluatorId: { applicationId: app.id, evaluatorId: usuario.id } },
  });

  await db.evaluation.upsert({
    where: { applicationId_evaluatorId: { applicationId: app.id, evaluatorId: usuario.id } },
    create: {
      applicationId: app.id,
      evaluatorId: usuario.id,
      criterios,
      promedio: Number(promedio.toFixed(2)),
      fortalezas: d.fortalezas,
      areasOportunidad: d.areasOportunidad,
      dictamen: d.dictamen,
    },
    update: {
      criterios,
      promedio: Number(promedio.toFixed(2)),
      fortalezas: d.fortalezas,
      areasOportunidad: d.areasOportunidad,
      dictamen: d.dictamen,
    },
  });

  await recalcular(app.id);

  await registrar({
    accion: previa ? "evaluacion.actualizada" : "evaluacion.guardada",
    actorId: usuario.id,
    entidad: "Application",
    entidadId: app.id,
    detalle: {
      folio: app.folio,
      promedio: Number(promedio.toFixed(2)),
      dictamen: d.dictamen,
      dictamenPrevio: previa?.dictamen ?? null,
    },
  });

  revalidatePath("/admin/aplicaciones");
  revalidatePath(`/admin/aplicaciones/${app.id}`);
  return { ok: true };
}

/** Lanza la evaluación por IA de las pendientes y las que fallaron. */
export async function ejecutarEvaluacionIA(): Promise<{
  ok?: boolean;
  error?: string;
  resumen?: string;
}> {
  let usuario;
  try {
    usuario = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  if (!iaConfigurada()) {
    return { error: "Falta OPENAI_API_KEY en el servidor." };
  }

  const r = await evaluarPendientes(10);

  await registrar({
    accion: "ia.ejecutada",
    actorId: usuario.id,
    entidad: "Edicion",
    entidadId: CLAVE_EDICION,
    detalle: r,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/aplicaciones");

  return {
    ok: true,
    resumen:
      r.procesadas === 0
        ? "No hay evaluaciones pendientes."
        : `${r.ok} generadas, ${r.fallidas} con error, de ${r.procesadas} procesadas.`,
  };
}

/** Publica los resultados.
 *
 *  Es el acto que hace visible el dictamen a las aplicantes, así que se
 *  registra en bitácora y a partir de él las evaluaciones quedan firmes.
 *  Requiere que no queden aplicaciones sin evaluar: publicar a medias dejaría
 *  a algunas viendo "en evaluación" sin fecha. */
export async function publicarResultados(): Promise<{
  ok?: boolean;
  error?: string;
  resumen?: string;
}> {
  let usuario;
  try {
    usuario = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  const edicion = await edicionActual();
  if (resultadosPublicados(edicion)) {
    return { error: "Los resultados ya estaban publicados." };
  }

  const sinEvaluar = await db.application.count({
    where: { estado: { in: ["submitted", "in_review"] } },
  });
  if (sinEvaluar > 0) {
    return {
      error: `Faltan ${sinEvaluar} ${sinEvaluar === 1 ? "aplicación" : "aplicaciones"} por evaluar. Publicar ahora dejaría a esas aplicantes sin dictamen.`,
    };
  }

  await db.edicion.update({
    where: { id: edicion.id },
    data: { resultadosPublicadosEn: new Date() },
  });

  await registrar({
    accion: "resultados.publicados",
    actorId: usuario.id,
    entidad: "Edicion",
    entidadId: edicion.clave,
    detalle: { publicadosEn: new Date().toISOString() },
  });

  // Aviso a cada aplicante con dictamen. El envío no puede revertir la
  // publicación: si el correo falla, el resultado ya está visible en la
  // plataforma y eso es lo que cuenta.
  const conDictamen = await db.application.findMany({
    where: { dictamen: { not: null } },
    include: { user: { select: { nombre: true, email: true } } },
  });

  let enviados = 0;
  for (const a of conDictamen) {
    if (await correoResultados(a.user.email, a.user.nombre.split(/\s+/)[0], a.folio)) enviados++;
  }

  revalidatePath("/admin");
  revalidatePath("/resultado");

  return {
    ok: true,
    resumen: `Resultados publicados. Se notificó a ${enviados} de ${conDictamen.length} aplicantes.`,
  };
}
