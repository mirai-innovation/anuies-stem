"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigeRol } from "@/lib/sesion";
import { confirmacionAbierta, edicionActual, resultadosPublicados } from "@/lib/edicion";
import { registrar } from "@/lib/bitacora";

export type EstadoConfirmar = { ok?: boolean; error?: string; errores?: Record<string, string> };

/** Solo puede confirmar quien fue seleccionada, y solo dentro de la ventana.
 *  Las tres condiciones se comprueban aquí y no en la vista. */
async function aplicacionConfirmable() {
  const usuario = await exigeRol("applicant");
  const edicion = await edicionActual();

  if (!resultadosPublicados(edicion)) throw new Error("Los resultados aún no se publican.");
  if (!confirmacionAbierta(edicion)) {
    throw new Error("La ventana de confirmación no está abierta.");
  }

  const app = await db.application.findUnique({ where: { userId: usuario.id } });
  if (!app) throw new Error("No existe una aplicación para esta cuenta.");
  if (app.dictamen !== "selected") {
    throw new Error("La confirmación es solo para las aplicantes seleccionadas.");
  }

  return { usuario, app };
}

const Esquema = z.object({
  ciudadOrigen: z.string().trim().max(80),
  requerimientosAlimentarios: z.string().trim().max(300),
  contactoEmergencia: z.string().trim().max(160),
  tallaPlayera: z.string().trim().max(4),
  confirmoParticipacion: z.string().optional(),
  aceptaTerminos: z.string().optional(),
});

export async function confirmarParticipacion(
  _previo: EstadoConfirmar,
  datos: FormData,
): Promise<EstadoConfirmar> {
  let ctx;
  try {
    ctx = await aplicacionConfirmable();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo confirmar." };
  }

  const parseo = Esquema.safeParse(Object.fromEntries(datos));
  if (!parseo.success) return { error: "Revisa los datos capturados." };
  const d = parseo.data;

  const errores: Record<string, string> = {};
  if (!d.confirmoParticipacion) {
    errores.confirmoParticipacion = "Debes confirmar tu participación presencial.";
  }
  if (!d.aceptaTerminos) {
    errores.aceptaTerminos = "Debes aceptar los términos de la beca y el reglamento.";
  }
  if (!d.ciudadOrigen) errores.ciudadOrigen = "Indica tu ciudad de origen.";
  if (!d.contactoEmergencia) {
    errores.contactoEmergencia = "Indica un contacto de emergencia con nombre y teléfono.";
  }
  if (!d.tallaPlayera) errores.tallaPlayera = "Selecciona tu talla.";
  if (Object.keys(errores).length) return { errores };

  await db.application.update({
    where: { id: ctx.app.id },
    data: {
      confirmacion: {
        estado: "confirmada",
        respondidoEn: new Date(),
        ciudadOrigen: d.ciudadOrigen,
        requerimientosAlimentarios: d.requerimientosAlimentarios || null,
        contactoEmergencia: d.contactoEmergencia,
        tallaPlayera: d.tallaPlayera,
        aceptaTerminos: true,
      },
    },
  });

  await registrar({
    accion: "participacion.confirmada",
    actorId: ctx.usuario.id,
    entidad: "Application",
    entidadId: ctx.app.id,
    detalle: { folio: ctx.app.folio },
  });

  revalidatePath("/confirmacion");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function declinarLugar(): Promise<EstadoConfirmar> {
  let ctx;
  try {
    ctx = await aplicacionConfirmable();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo registrar." };
  }

  await db.application.update({
    where: { id: ctx.app.id },
    data: {
      confirmacion: {
        estado: "declinada",
        respondidoEn: new Date(),
        aceptaTerminos: false,
      },
    },
  });

  await registrar({
    accion: "participacion.declinada",
    actorId: ctx.usuario.id,
    entidad: "Application",
    entidadId: ctx.app.id,
    detalle: { folio: ctx.app.folio },
  });

  revalidatePath("/confirmacion");
  revalidatePath("/dashboard");
  return { ok: true };
}
