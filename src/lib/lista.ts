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
 *  Para el comité, una aplicación que no se envió no existe. Administración sí
 *  las ve: durante la convocatoria abierta necesita saber cuántas están a
 *  medias y qué les falta, que es distinto de evaluarlas —eso sigue vedado
 *  hasta el envío. */
export function condiciones(
  f: FiltrosLista,
  incluirBorradores = false,
): Prisma.ApplicationWhereInput {
  const donde: Prisma.ApplicationWhereInput = incluirBorradores ? {} : { estado: { not: "draft" } };
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

export async function consultarAplicaciones(f: FiltrosLista, incluirBorradores = false) {
  const donde = condiciones(f, incluirBorradores);
  const pagina = Math.max(1, Number(f.pagina ?? 1) || 1);

  const [total, filas] = await Promise.all([
    db.application.count({ where: donde }),
    db.application.findMany({
      where: donde,
      include: INCLUIR,
      // Las evaluadas primero por puntaje; las enviadas por antigüedad; los
      // borradores, que no tienen ninguna de las dos, por actividad reciente,
      // que es lo único que dice algo de ellos.
      orderBy: [{ puntajeComite: "desc" }, { enviadaEn: "asc" }, { actualizadaEn: "desc" }],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ]);

  return { total, filas, pagina, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)) };
}

/** KPIs de la cabecera de la lista. */
export async function kpisLista() {
  const [recibidas, enProgreso, evaluadas, seleccionadas, promedio] = await Promise.all([
    db.application.count({ where: { estado: { not: "draft" } } }),
    db.application.count({ where: { estado: "draft" } }),
    db.application.count({ where: { estado: { in: ["evaluated", "selected", "waitlist", "rejected"] } } }),
    db.application.count({ where: { dictamen: "selected" } }),
    db.application.aggregate({
      where: { puntajeComite: { not: null } },
      _avg: { puntajeComite: true },
    }),
  ]);

  return {
    recibidas,
    enProgreso,
    evaluadas,
    seleccionadas,
    promedio: promedio._avg.puntajeComite,
  };
}
