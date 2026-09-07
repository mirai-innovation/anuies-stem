import { redirect } from "next/navigation";
import { cache } from "react";
import type { Rol } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "./db";

/** Toda página y toda acción del servidor pasa por aquí. La UI puede ocultar
 *  un botón, pero lo que niega el acceso es esta comprobación, del lado del
 *  servidor y antes de tocar la base.
 *
 *  La sesión vive en un JWT, así que el rol viaja firmado dentro del token.
 *  Eso significa que un cambio de rol —o la baja de una cuenta— no surtiría
 *  efecto hasta que el token expire. Por eso se relee el usuario: manda el rol
 *  que está hoy en la base, no el que se firmó al iniciar sesión. */
export const sesionActual = cache(async () => {
  const s = await auth();
  if (!s?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: s.user.id },
    select: { id: true, nombre: true, email: true, rol: true, emailVerifiedAt: true },
  });

  if (!user || !user.emailVerifiedAt) return null;

  return { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
});

export async function requiereSesion() {
  const user = await sesionActual();
  if (!user) redirect("/login");
  return user;
}

export async function requiereRol(...roles: Rol[]) {
  const user = await requiereSesion();
  if (!roles.includes(user.rol)) redirect("/sin-permiso");
  return user;
}

/** Lanza en lugar de redirigir: para acciones del servidor y rutas de API,
 *  donde una redirección enmascararía el fallo de autorización. */
export async function exigeRol(...roles: Rol[]) {
  const user = await sesionActual();
  if (!user) throw new Error("No autenticado");
  if (!roles.includes(user.rol)) throw new Error("Sin permiso");
  return user;
}

export const esAdmin = (rol: Rol) => rol === "admin";
export const puedeRevisar = (rol: Rol) => rol === "admin" || rol === "anuies";
