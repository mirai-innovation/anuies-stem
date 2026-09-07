"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { consumirToken, emitirToken } from "@/lib/tokens";
import { correoRecuperacion } from "@/lib/correo";

export type EstadoRecuperacion = { ok?: boolean; error?: string };

/** Responde siempre lo mismo, exista o no la cuenta: de otro modo el
 *  formulario serviría para averiguar qué correos están registrados. */
export async function pedirRecuperacion(
  _previo: EstadoRecuperacion,
  datos: FormData,
): Promise<EstadoRecuperacion> {
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) {
    return { error: "Escribe un correo válido." };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    const token = await emitirToken(user.id, "recuperacion_password");
    await correoRecuperacion(user.email, user.nombre.split(/\s+/)[0], token);
  }

  return { ok: true };
}

export async function cambiarPassword(
  _previo: EstadoRecuperacion,
  datos: FormData,
): Promise<EstadoRecuperacion> {
  const token = String(datos.get("token") ?? "");
  const password = String(datos.get("password") ?? "");
  const confirmar = String(datos.get("confirmar") ?? "");

  if (password.length < 10) return { error: "La contraseña debe tener al menos 10 caracteres." };
  if (password !== confirmar) return { error: "Las contraseñas no coinciden." };

  const userId = await consumirToken(token, "recuperacion_password");
  if (!userId) {
    return { error: "El enlace ya se usó o venció. Pide uno nuevo." };
  }

  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(password),
      // Cambiar la contraseña con el enlace del correo demuestra que la
      // persona lo recibe, así que la cuenta queda verificada.
      emailVerifiedAt: new Date(),
    },
  });

  return { ok: true };
}
