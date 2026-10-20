import { db } from "./db";
import { faltantesParaEnviar } from "./aplicacion";
import { nombreDePila } from "./constantes";

export type Destinataria = {
  userId: string;
  nombre: string;
  email: string;
  folio: string | null;
  /** null = aún no inicia su aplicación. */
  faltantes: string[] | null;
};

/** Quién recibe el recordatorio de cierre: aplicantes con cuenta verificada
 *  que no han enviado, tengan borrador o no hayan empezado.
 *
 *  Las cuentas sin verificar quedan fuera: no pueden iniciar sesión, así que
 *  un recordatorio de "termina tu aplicación" no les sirve de nada. Se cuentan
 *  aparte para que el panel lo diga.
 *
 *  `soloIds` acota la búsqueda a un lote: cada lote se vuelve a validar al
 *  enviarse, porque entre el inicio del envío y ese momento alguien pudo haber
 *  enviado su aplicación. */
export async function destinatariasRecordatorio(soloIds?: string[]) {
  const usuarios = await db.user.findMany({
    where: {
      rol: "applicant",
      ...(soloIds ? { id: { in: soloIds } } : {}),
    },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      email: true,
      emailVerifiedAt: true,
      aplicacion: true,
    },
  });

  const destinatarias: Destinataria[] = [];
  let sinVerificar = 0;

  for (const u of usuarios) {
    if (u.aplicacion && u.aplicacion.estado !== "draft") continue;
    if (!u.emailVerifiedAt) {
      sinVerificar++;
      continue;
    }
    destinatarias.push({
      userId: u.id,
      nombre: nombreDePila(u.nombre),
      email: u.email,
      folio: u.aplicacion?.folio ?? null,
      faltantes: u.aplicacion ? faltantesParaEnviar(u.aplicacion) : null,
    });
  }

  return { destinatarias, sinVerificar };
}
