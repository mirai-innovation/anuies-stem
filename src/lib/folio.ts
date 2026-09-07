import { db } from "./db";
import { CLAVE_EDICION } from "./edicion";

/** Folio A4MX-2026-NNNN.
 *
 *  Se usa findAndModify con $inc porque dos aplicantes que envian su registro
 *  en el mismo instante deben recibir folios distintos. Calcularlo con un
 *  "max + 1" leido antes de escribir es exactamente la condicion de carrera
 *  que produce folios duplicados. */
export async function siguienteFolio(clave = CLAVE_EDICION) {
  const res = (await db.$runCommandRaw({
    findAndModify: "Contador",
    query: { _id: `folio:${clave}` },
    update: { $inc: { valor: 1 } },
    new: true,
    upsert: true,
  })) as { value?: { valor?: number } };

  const n = res.value?.valor ?? 1;
  return `A4MX-${clave}-${String(n).padStart(4, "0")}`;
}
