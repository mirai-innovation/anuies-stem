"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigeRol } from "@/lib/sesion";
import { edicionActual, recepcionAbierta } from "@/lib/edicion";
import { correoConfigurado, correoRecordatorioCierre } from "@/lib/correo";
import { destinatariasRecordatorio } from "@/lib/recordatorios";
import { TAMANO_LOTE, nombreDePila } from "@/lib/constantes";
import { registrar } from "@/lib/bitacora";

type Resultado = { ok?: boolean; error?: string; resumen?: string };

const EJEMPLO_FALTANTES = [
  "Completa la propuesta del paso 2.",
  "Falta el documento: Carta compromiso.",
];

/** Manda el recordatorio a una sola dirección, marcado como prueba.
 *  No toca a ninguna aplicante. */
export async function enviarPrueba(
  correo: string,
  variante: "borrador" | "sin_iniciar",
): Promise<Resultado> {
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
  const ok = await correoRecordatorioCierre(para.data, {
    nombre: nombreDePila(actor.nombre),
    cierre: edicion.cierreRecepcion,
    faltantes: variante === "borrador" ? EJEMPLO_FALTANTES : null,
    prueba: true,
  });

  await registrar({
    accion: "recordatorio.prueba",
    actorId: actor.id,
    entidad: "Edicion",
    entidadId: edicion.clave,
    detalle: { para: para.data, variante, ok },
  });

  revalidatePath("/admin/recordatorios");
  return ok
    ? { ok: true, resumen: `Prueba enviada a ${para.data}. Revisa también la carpeta de spam.` }
    : { error: `No se pudo enviar la prueba a ${para.data}. Revisa la consola del servidor.` };
}

/** Arranca un envío masivo: fija la lista de destinatarias y abre su registro
 *  en bitácora, que cada lote va actualizando. */
export async function iniciarEnvio(): Promise<
  Resultado & { envioId?: string; ids?: string[] }
> {
  let actor;
  try {
    actor = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  if (!correoConfigurado()) return { error: "Falta EMAIL_USER / EMAIL_PASS en el servidor." };

  const edicion = await edicionActual();
  if (!recepcionAbierta(edicion)) {
    return { error: "La recepción ya cerró: el recordatorio ya no tiene sentido." };
  }

  const { destinatarias } = await destinatariasRecordatorio();
  if (destinatarias.length === 0) return { error: "No hay aplicantes pendientes de enviar." };

  const log = await db.auditLog.create({
    data: {
      accion: "recordatorio.envio",
      actorId: actor.id,
      entidad: "Edicion",
      entidadId: edicion.clave,
      detalle: { total: destinatarias.length, enviados: 0, fallidos: [], omitidos: 0 },
    },
  });

  return { ok: true, envioId: log.id, ids: destinatarias.map((d) => d.userId) };
}

type Detalle = { total: number; enviados: number; fallidos: string[]; omitidos: number };

export async function enviarLote(
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
  if (!log || log.accion !== "recordatorio.envio") return { error: "Envío desconocido." };

  const edicion = await edicionActual();
  if (!recepcionAbierta(edicion)) return { error: "La recepción cerró durante el envío." };

  // Se vuelve a validar: quien envió su aplicación desde que empezó el envío
  // ya no debe recibir el recordatorio.
  const { destinatarias } = await destinatariasRecordatorio(ids);
  const omitidos = ids.length - destinatarias.length;

  let enviados = 0;
  const fallidos: string[] = [];
  for (const d of destinatarias) {
    const ok = await correoRecordatorioCierre(d.email, {
      nombre: d.nombre,
      cierre: edicion.cierreRecepcion,
      faltantes: d.faltantes,
    });
    if (ok) enviados++;
    else fallidos.push(d.email);
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
