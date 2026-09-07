import { db } from "./db";
import { TECNOLOGIAS } from "./constantes";
import type { Tecnologia } from "@prisma/client";

/** Cifras del panel de administración. Se calculan en una sola pasada por
 *  colección en lugar de recorrer las aplicaciones en memoria. */
export async function datosPanel() {
  const [
    recibidas,
    borradores,
    evaluadas,
    conIA,
    iaPendiente,
    iaError,
    seleccionadas,
    listaEspera,
    confirmadas,
    promedio,
    conteosTecnologia,
  ] = await Promise.all([
    db.application.count({ where: { estado: { not: "draft" } } }),
    db.application.count({ where: { estado: "draft" } }),
    db.application.count({
      where: { estado: { in: ["evaluated", "selected", "waitlist", "rejected"] } },
    }),
    db.aiEvaluation.count({ where: { estado: "ok" } }),
    db.aiEvaluation.count({ where: { estado: "pending" } }),
    db.aiEvaluation.count({ where: { estado: "error" } }),
    db.application.count({ where: { dictamen: "selected" } }),
    db.application.count({ where: { dictamen: "waitlist" } }),
    db.application.count({ where: { confirmacion: { is: { estado: "confirmada" } } } }),
    db.application.aggregate({
      where: { puntajeComite: { not: null } },
      _avg: { puntajeComite: true },
    }),
    // Prisma no agrupa por campos de un tipo embebido en MongoDB, así que se
    // cuenta una vez por tecnología. Son cinco valores fijos.
    Promise.all(
      (Object.keys(TECNOLOGIAS) as Tecnologia[]).map(async (t) => ({
        clave: t,
        n: await db.application.count({
          where: { estado: { not: "draft" }, propuesta: { is: { tecnologia: t } } },
        }),
      })),
    ),
  ]);

  const maximo = Math.max(1, ...conteosTecnologia.map((c) => c.n));

  return {
    recibidas,
    borradores,
    evaluadas,
    conIA,
    iaPendiente,
    iaError,
    seleccionadas,
    listaEspera,
    confirmadas,
    promedio: promedio._avg.puntajeComite,
    tecnologias: conteosTecnologia.map((c) => ({
      clave: c.clave,
      label: TECNOLOGIAS[c.clave],
      n: c.n,
      pct: `${Math.round((c.n / maximo) * 100)}%`,
    })),
  };
}
