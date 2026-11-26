import { db } from "./db";
import { nombreDePila } from "./constantes";

export type EstadoConf = "confirmada" | "pendiente" | "declinada";

export type FilaConfirmacion = {
  appId: string;
  userId: string;
  folio: string;
  nombre: string;
  email: string;
  universidad: string;
  estado: EstadoConf;
  respondidoEn: Date | null;
  ciudadOrigen: string | null;
  tallaPlayera: string | null;
  requerimientosAlimentarios: string | null;
  contactoEmergencia: string | null;
};

/** Todas las aplicantes con dictamen de seleccionada y su respuesta.
 *
 *  Sin registro de confirmación cuenta como pendiente: es el caso de quien
 *  todavía no entra a la pantalla de confirmación. El filtro de estado se hace
 *  aquí y no en la consulta porque en Mongo un subdocumento ausente y uno con
 *  estado "pendiente" son dos casos distintos para Prisma. */
export async function seleccionadas(soloUserIds?: string[]): Promise<FilaConfirmacion[]> {
  const apps = await db.application.findMany({
    where: {
      dictamen: "selected",
      ...(soloUserIds ? { userId: { in: soloUserIds } } : {}),
    },
    orderBy: { folio: "asc" },
    include: {
      user: { select: { id: true, nombre: true, email: true } },
      universidad: { select: { siglas: true } },
    },
  });

  return apps.map((a) => ({
    appId: a.id,
    userId: a.userId,
    folio: a.folio,
    nombre: a.datos?.nombreCompleto?.trim() || a.user.nombre,
    email: a.user.email,
    universidad: a.universidad?.siglas ?? a.academicos?.universidad ?? "—",
    estado: (a.confirmacion?.estado ?? "pendiente") as EstadoConf,
    respondidoEn: a.confirmacion?.respondidoEn ?? null,
    ciudadOrigen: a.confirmacion?.ciudadOrigen ?? null,
    tallaPlayera: a.confirmacion?.tallaPlayera ?? null,
    requerimientosAlimentarios: a.confirmacion?.requerimientosAlimentarios ?? null,
    contactoEmergencia: a.confirmacion?.contactoEmergencia ?? null,
  }));
}

/** Quién recibe el recordatorio: seleccionadas que no han respondido.
 *  `soloUserIds` acota a un lote, que se vuelve a validar al enviarse porque
 *  alguien pudo confirmar o declinar entre el inicio del envío y ese momento. */
export async function pendientesDeConfirmar(soloUserIds?: string[]) {
  const filas = await seleccionadas(soloUserIds);
  return filas
    .filter((f) => f.estado === "pendiente")
    .map((f) => ({ ...f, nombrePila: nombreDePila(f.nombre) }));
}
