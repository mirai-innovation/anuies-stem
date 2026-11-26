"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigeRol } from "@/lib/sesion";
import { confirmacionAbierta, edicionActual, resultadosPublicados } from "@/lib/edicion";
import { correoConfigurado, correoRecordatorioConfirmacion } from "@/lib/correo";
import { pendientesDeConfirmar } from "@/lib/confirmaciones";
import { TAMANO_LOTE, nombreDePila } from "@/lib/constantes";
import { registrar } from "@/lib/bitacora";

type Resultado = { ok?: boolean; error?: string; resumen?: string };

const ACCION_ENVIO = "confirmacion.recordatorio.envio";
const ACCION_PRUEBA = "confirmacion.recordatorio.prueba";

/** El recordatorio solo tiene sentido con resultados publicados y la ventana
 *  de confirmación abierta: antes no hay nada que confirmar y después la
 *  plataforma ya no acepta la respuesta. */
async function ventanaValida() {
  const edicion = await edicionActual();
  if (!resultadosPublicados(edicion)) return { edicion, error: "Los resultados aún no se publican." };
  if (!confirmacionAbierta(edicion)) {
    return { edicion, error: "La ventana de confirmación no está abierta." };
  }
  return { edicion, error: null };
}

/** Manda el recordatorio a una sola dirección, marcado como prueba. */
export async function enviarPruebaConfirmacion(correo: string): Promise<Resultado> {
  let actor;
  try {
    actor = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  const para = z.string().trim().toLowerCase().email().safeParse(correo);
  if (!para.success) return { error: "Escribe un correo válido para la prueba." };
  if (!correoConfigurado()) return { error: "Falta EMAIL_USER / EMAIL_PASS en el servidor." };

  const edicion = await edicionActual();
  const ok = await correoRecordatorioConfirmacion(para.data, {
    nombre: nombreDePila(actor.nombre),
    cierra: edicion.confirmacionCierra,
    eventoInicia: edicion.eventoInicia,
    eventoTermina: edicion.eventoTermina,
    prueba: true,
  });

  await registrar({
    accion: ACCION_PRUEBA,
    actorId: actor.id,
    entidad: "Edicion",
    entidadId: edicion.clave,
    detalle: { para: para.data, ok },
  });

  revalidatePath("/admin/confirmaciones");
  return ok
    ? { ok: true, resumen: `Prueba enviada a ${para.data}. Revisa también la carpeta de spam.` }
    : { error: `No se pudo enviar la prueba a ${para.data}. Revisa la consola del servidor.` };
}

/** Fija la lista de pendientes y abre su registro en bitácora. */
export async function iniciarEnvioConfirmacion(): Promise<
  Resultado & { envioId?: string; ids?: string[] }
> {
  let actor;
  try {
    actor = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  if (!correoConfigurado()) return { error: "Falta EMAIL_USER / EMAIL_PASS en el servidor." };

  const { edicion, error } = await ventanaValida();
  if (error) return { error };

  const pendientes = await pendientesDeConfirmar();
  if (pendientes.length === 0) return { error: "No hay seleccionadas pendientes de confirmar." };

  const log = await db.auditLog.create({
    data: {
      accion: ACCION_ENVIO,
      actorId: actor.id,
      entidad: "Edicion",
      entidadId: edicion.clave,
      detalle: { total: pendientes.length, enviados: 0, fallidos: [], omitidos: 0 },
    },
  });

  return { ok: true, envioId: log.id, ids: pendientes.map((p) => p.userId) };
}

type Detalle = { total: number; enviados: number; fallidos: string[]; omitidos: number };

export async function enviarLoteConfirmacion(
  envioId: string,
  ids: string[],
): Promise<Resultado & { enviados?: number; fallidos?: string[]; omitidos?: number }> {
  try {
    await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  if (ids.length === 0 || ids.length > TAMANO_LOTE) return { error: "Lote inválido." };

  const log = await db.auditLog.findUnique({ where: { id: envioId } });
  if (!log || log.accion !== ACCION_ENVIO) return { error: "Envío desconocido." };

  const { edicion, error } = await ventanaValida();
  if (error) return { error: `${error} Se detuvo el envío.` };

  // Quien confirmó o declinó desde que empezó el envío ya no lo recibe.
  const pendientes = await pendientesDeConfirmar(ids);
  const omitidos = ids.length - pendientes.length;

  let enviados = 0;
  const fallidos: string[] = [];
  for (const p of pendientes) {
    const ok = await correoRecordatorioConfirmacion(p.email, {
      nombre: p.nombrePila,
      cierra: edicion.confirmacionCierra,
      eventoInicia: edicion.eventoInicia,
      eventoTermina: edicion.eventoTermina,
    });
    if (ok) enviados++;
    else fallidos.push(p.email);
  }

  const previo = log.detalle as Detalle;
  await db.auditLog.update({
    where: { id: envioId },
    data: {
      detalle: {
        total: previo.total,
        enviados: previo.enviados + enviados,
        fallidos: [...previo.fallidos, ...fallidos],
        omitidos: previo.omitidos + omitidos,
      },
    },
  });

  return { ok: true, enviados, fallidos, omitidos };
}
