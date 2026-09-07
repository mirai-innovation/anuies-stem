import { createHash, randomBytes } from "node:crypto";
import type { TipoToken } from "@prisma/client";
import { db } from "./db";

/** Se guarda el hash del token, nunca el valor en claro: si alguien lee la
 *  base no puede verificar un correo ni cambiar una contrasena ajena. */
function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const VIGENCIA_HORAS: Record<TipoToken, number> = {
  verificacion_correo: 48,
  recuperacion_password: 1,
};

export async function emitirToken(userId: string, tipo: TipoToken) {
  const token = randomBytes(32).toString("base64url");
  const expiraEn = new Date(Date.now() + VIGENCIA_HORAS[tipo] * 3_600_000);

  // Un token vigente por tipo: emitir uno nuevo invalida los anteriores.
  await db.token.deleteMany({ where: { userId, tipo, usadoEn: null } });
  await db.token.create({ data: { tipo, hash: digest(token), userId, expiraEn } });

  return token;
}

/** Consume el token: devuelve el userId si era valido, o null. Un token solo
 *  sirve una vez. */
export async function consumirToken(token: string, tipo: TipoToken) {
  const registro = await db.token.findUnique({ where: { hash: digest(token) } });
  if (!registro) return null;
  if (registro.tipo !== tipo) return null;
  if (registro.usadoEn) return null;
  if (registro.expiraEn < new Date()) return null;

  await db.token.update({ where: { id: registro.id }, data: { usadoEn: new Date() } });
  return registro.userId;
}
