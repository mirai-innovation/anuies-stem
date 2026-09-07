import { db } from "./db";
import type { Prisma } from "@prisma/client";

/** Bitacora de auditoria. Se registra todo lo que altera una evaluacion, un
 *  dictamen o la publicacion de resultados: son las decisiones que alguien
 *  podria tener que justificar despues. */
export async function registrar(opts: {
  accion: string;
  actorId?: string | null;
  entidad: string;
  entidadId?: string | null;
  detalle?: Prisma.InputJsonValue;
}) {
  await db.auditLog.create({
    data: {
      accion: opts.accion,
      actorId: opts.actorId ?? null,
      entidad: opts.entidad,
      entidadId: opts.entidadId ?? null,
      detalle: opts.detalle,
    },
  });
}
