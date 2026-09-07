import type { EstadoAplicacion, Prisma, Tecnologia } from "@prisma/client";
import { db } from "./db";

export const POR_PAGINA = 8;

export type FiltrosLista = {
  q?: string;
  estado?: string;
  universidad?: string;
  tecnologia?: string;
  pagina?: string;
};

/** Construye el filtro de la lista de revisión.
 *
 *  Los borradores nunca aparecen: una aplicación que no se envió no existe
 *  para el comité, aunque tenga folio asignado. */
export function condiciones(f: FiltrosLista): Prisma.ApplicationWhereInput {
  const donde: Prisma.ApplicationWhereInput = { estado: { not: "draft" } };
  const y: Prisma.ApplicationWhereInput[] = [];

  if (f.estado && f.estado !== "todos") {
    y.push({ estado: f.estado as EstadoAplicacion });
  }
  if (f.universidad && f.universidad !== "todas") {
    y.push({ universidadId: f.universidad });
  }
  if (f.tecnologia && f.tecnologia !== "todas") {
    y.push({ propuesta: { is: { tecnologia: f.tecnologia as Tecnologia } } });
  }

  const q = f.q?.trim();
  if (q) {
    y.push({
      OR: [
        { folio: { contains: q, mode: "insensitive" } },
        { datos: { is: { nombreCompleto: { contains: q, mode: "insensitive" } } } },
        { propuesta: { is: { nombre: { contains: q, mode: "insensitive" } } } },
        { universidad: { is: { nombre: { contains: q, mode: "insensitive" } } } },
        { universidad: { is: { siglas: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }

  if (y.length) donde.AND = y;
  return donde;
}

export const INCLUIR = {
  universidad: { select: { siglas: true, nombre: true } },
  evaluacionIA: { select: { estado: true, scoreGlobal: true } },
} satisfies Prisma.ApplicationInclude;

export async function consultarAplicaciones(f: FiltrosLista) {
  const donde = condiciones(f);
  const pagina = Math.max(1, Number(f.pagina ?? 1) || 1);

  const [total, filas] = await Promise.all([
    db.application.count({ where: donde }),
    db.application.findMany({
      where: donde,
      include: INCLUIR,
      orderBy: [{ puntajeComite: "desc" }, { enviadaEn: "asc" }],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ]);

  return { total, filas, pagina, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)) };
}

/** KPIs de la cabecera de la lista. */
export async function kpisLista() {
  const [recibidas, evaluadas, seleccionadas, promedio] = await Promise.all([
    db.application.count({ where: { estado: { not: "draft" } } }),
    db.application.count({ where: { estado: { in: ["evaluated", "selected", "waitlist", "rejected"] } } }),
    db.application.count({ where: { dictamen: "selected" } }),
    db.application.aggregate({
      where: { puntajeComite: { not: null } },
      _avg: { puntajeComite: true },
    }),
  ]);

  return {
    recibidas,
    evaluadas,
    seleccionadas,
    promedio: promedio._avg.puntajeComite,
  };
}
