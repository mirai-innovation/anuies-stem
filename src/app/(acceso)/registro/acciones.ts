"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { emitirToken } from "@/lib/tokens";
import { correoVerificacion } from "@/lib/correo";
import { edicionActual, recepcionAbierta } from "@/lib/edicion";
import { siguienteFolio } from "@/lib/folio";

const Esquema = z
  .object({
    nombre: z.string().trim().min(3, "Escribe tu nombre completo.").max(120),
    email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
    universidadId: z.string().trim().min(1, "Selecciona tu universidad."),
    password: z
      .string()
      .min(10, "La contraseña debe tener al menos 10 caracteres.")
      .max(200),
    confirmar: z.string(),
    declaraElegibilidad: z.string().optional(),
    aceptaAviso: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmar"],
  })
  .refine((d) => Boolean(d.declaraElegibilidad), {
    message: "Debes declarar que cumples los requisitos de elegibilidad.",
    path: ["declaraElegibilidad"],
  })
  .refine((d) => Boolean(d.aceptaAviso), {
    message: "Debes aceptar el aviso de privacidad y las bases.",
    path: ["aceptaAviso"],
  });

export type EstadoRegistro = {
  ok?: boolean;
  correoEnviado?: boolean;
  errores?: Record<string, string>;
  error?: string;
};

export async function crearCuenta(
  _previo: EstadoRegistro,
  datos: FormData,
): Promise<EstadoRegistro> {
  const edicion = await edicionActual();
  if (!recepcionAbierta(edicion)) {
    return { error: "La recepción de aplicaciones está cerrada; ya no se pueden crear cuentas." };
  }

  const parseo = Esquema.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    const errores: Record<string, string> = {};
    for (const i of parseo.error.issues) {
      const campo = String(i.path[0] ?? "general");
      errores[campo] ??= i.message;
    }
    return { errores };
  }

  const d = parseo.data;

  const universidad = await db.universidad.findUnique({ where: { id: d.universidadId } });
  if (!universidad || !universidad.activa) {
    return { errores: { universidadId: "Esa institución no está en el catálogo ANUIES." } };
  }

  const existente = await db.user.findUnique({ where: { email: d.email } });
  if (existente) {
    // No se confirma ni se niega la existencia de la cuenta más allá de lo que
    // la persona ya sabe al intentar registrarse con su propio correo.
    return {
      errores: {
        email: "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.",
      },
    };
  }

  const user = await db.user.create({
    data: {
      nombre: d.nombre,
      email: d.email,
      passwordHash: await hashPassword(d.password),
      rol: "applicant",
    },
  });

  // El borrador se crea junto con la cuenta para que el folio exista desde el
  // principio: el diseño lo muestra como "folio provisional" antes del envío.
  const folio = await siguienteFolio();
  await db.application.create({
    data: {
      folio,
      userId: user.id,
      estado: "draft",
      universidadId: universidad.id,
      datos: { nombreCompleto: d.nombre, correoInstitucional: d.email },
      academicos: { universidadId: universidad.id, declaraNoUltimoAnio: true },
    },
  });

  const token = await emitirToken(user.id, "verificacion_correo");
  const correoEnviado = await correoVerificacion(d.email, d.nombre.split(/\s+/)[0], token);

  return { ok: true, correoEnviado };
}

/** Reenvía el enlace de verificación. Responde igual exista o no la cuenta,
 *  para no convertir el formulario en una forma de averiguar qué correos están
 *  registrados. */
export async function reenviarVerificacion(email: string): Promise<{ ok: boolean }> {
  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (user && !user.emailVerifiedAt) {
    const token = await emitirToken(user.id, "verificacion_correo");
    await correoVerificacion(user.email, user.nombre.split(/\s+/)[0], token);
  }

  return { ok: true };
}
