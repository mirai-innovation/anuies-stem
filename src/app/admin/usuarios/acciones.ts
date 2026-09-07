"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Rol } from "@prisma/client";
import { db } from "@/lib/db";
import { exigeRol } from "@/lib/sesion";
import { hashPassword } from "@/lib/password";
import { emitirToken } from "@/lib/tokens";
import { correoVerificacion } from "@/lib/correo";
import { registrar } from "@/lib/bitacora";

export type EstadoUsuario = { ok?: boolean; error?: string; resumen?: string };

export async function cambiarRol(userId: string, rol: Rol): Promise<EstadoUsuario> {
  let actor;
  try {
    actor = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  // Quitarse el propio rol de administración dejaría la sesión sin acceso al
  // panel desde el que se hizo el cambio.
  if (userId === actor.id && rol !== "admin") {
    return { error: "No puedes quitarte a ti misma el rol de administración." };
  }

  const objetivo = await db.user.findUnique({ where: { id: userId } });
  if (!objetivo) return { error: "La cuenta no existe." };

  // Una aplicante con postulación no puede cambiar de rol: su aplicación
  // quedaría huérfana de la vista que la muestra.
  if (objetivo.rol === "applicant" && rol !== "applicant") {
    const tiene = await db.application.findUnique({ where: { userId } });
    if (tiene) {
      return {
        error:
          "Esa cuenta tiene una postulación registrada. Cambiarle el rol la dejaría sin acceso a su propia aplicación.",
      };
    }
  }

  if (rol === "applicant" && objetivo.rol !== "applicant") {
    return { error: "No se puede convertir una cuenta del comité en aplicante." };
  }

  // Debe quedar al menos una cuenta de administración.
  if (objetivo.rol === "admin" && rol !== "admin") {
    const admins = await db.user.count({ where: { rol: "admin" } });
    if (admins <= 1) return { error: "Debe quedar al menos una cuenta de administración." };
  }

  await db.user.update({ where: { id: userId }, data: { rol } });

  await registrar({
    accion: "usuario.rol.cambiado",
    actorId: actor.id,
    entidad: "User",
    entidadId: userId,
    detalle: { de: objetivo.rol, a: rol, email: objetivo.email },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, resumen: `${objetivo.nombre} ahora es ${rol}.` };
}

const EsquemaCuenta = z.object({
  nombre: z.string().trim().min(3, "Escribe el nombre completo.").max(120),
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  organizacion: z.string().trim().max(120).optional(),
  rol: z.enum(["anuies", "admin"]),
});

/** Alta de cuentas de comité y ANUIES.
 *
 *  No se define contraseña aquí: se crea una aleatoria que nadie conoce y se
 *  manda el enlace de verificación, con el que la persona elige la suya. Así
 *  ninguna contraseña viaja por correo ni pasa por el administrador. */
export async function crearCuentaInterna(
  _previo: EstadoUsuario,
  datos: FormData,
): Promise<EstadoUsuario> {
  let actor;
  try {
    actor = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  const parseo = EsquemaCuenta.safeParse(Object.fromEntries(datos));
  if (!parseo.success) return { error: parseo.error.issues[0].message };
  const d = parseo.data;

  if (await db.user.findUnique({ where: { email: d.email } })) {
    return { error: "Ya existe una cuenta con ese correo." };
  }

  const provisional = crypto.randomUUID() + crypto.randomUUID();
  const user = await db.user.create({
    data: {
      nombre: d.nombre,
      email: d.email,
      passwordHash: await hashPassword(provisional),
      rol: d.rol,
      organizacion: d.organizacion || null,
    },
  });

  const token = await emitirToken(user.id, "verificacion_correo");
  const enviado = await correoVerificacion(d.email, d.nombre.split(/\s+/)[0], token);

  await registrar({
    accion: "usuario.creado",
    actorId: actor.id,
    entidad: "User",
    entidadId: user.id,
    detalle: { email: d.email, rol: d.rol },
  });

  revalidatePath("/admin/usuarios");
  return {
    ok: true,
    resumen: enviado
      ? `Cuenta creada. Se envió el enlace de activación a ${d.email}.`
      : `Cuenta creada, pero no se pudo enviar el correo de activación a ${d.email}.`,
  };
}
