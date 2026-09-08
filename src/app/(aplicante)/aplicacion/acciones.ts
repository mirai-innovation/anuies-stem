"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigeRol } from "@/lib/sesion";
import { edicionActual, recepcionAbierta } from "@/lib/edicion";
import { puedeEnviar, faltantesParaEnviar } from "@/lib/aplicacion";
import { registrar } from "@/lib/bitacora";
import { reconocerUniversidad } from "@/lib/universidades";

export type EstadoGuardado = {
  ok?: boolean;
  guardadaEn?: string;
  errores?: Record<string, string>;
  error?: string;
};

/** Una aplicación solo se puede tocar si es borrador y la recepción sigue
 *  abierta. Se comprueba aquí, en el servidor, y no solo escondiendo el botón:
 *  una petición fabricada a mano llega igual a esta función. */
async function borradorEditable() {
  const usuario = await exigeRol("applicant");
  const edicion = await edicionActual();

  if (!recepcionAbierta(edicion)) {
    throw new Error("La recepción de aplicaciones está cerrada.");
  }

  const app = await db.application.findUnique({ where: { userId: usuario.id } });
  if (!app) throw new Error("No existe una aplicación para esta cuenta.");
  if (app.estado !== "draft") throw new Error("Tu aplicación ya fue enviada y no puede editarse.");

  return { usuario, app, edicion };
}

const texto = (max: number) => z.string().trim().max(max);

/** CURP: 18 caracteres con la estructura oficial. */
const CURP = /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM](?:AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]\d$/;

const EsquemaDatos = z.object({
  nombreCompleto: texto(120),
  curp: z.string().trim().toUpperCase(),
  fechaNacimiento: z.string().trim(),
  telefono: texto(30),
  estadoResidencia: texto(60),
  correoInstitucional: z.string().trim().toLowerCase(),
  universidad: texto(160),
  programaEducativo: texto(120),
  nivel: z.enum(["licenciatura", "especialidad", "posgrado"]).or(z.literal("")),
  semestre: z.string().trim(),
  promedio: z.string().trim(),
  areaStem: z
    .enum(["ingenieria", "computacion", "ciencias_exactas", "matematicas", "ciencias_salud"])
    .or(z.literal("")),
  declaraNoUltimoAnio: z.string().optional(),
  nombrePropuesta: texto(120),
  problema: texto(800),
  impacto: texto(800),
});

/** Reglas de elegibilidad y de forma. Se aplican solo cuando la aplicante
 *  pide continuar; el autoguardado nunca bloquea por campos incompletos. */
function validarDatos(d: z.infer<typeof EsquemaDatos>, promedioMinimo: number) {
  const e: Record<string, string> = {};

  if (!d.nombreCompleto) e.nombreCompleto = "Escribe tu nombre completo.";
  if (!d.curp) e.curp = "Escribe tu CURP.";
  else if (!CURP.test(d.curp)) e.curp = "La CURP no tiene el formato oficial de 18 caracteres.";

  if (!d.fechaNacimiento) e.fechaNacimiento = "Indica tu fecha de nacimiento.";
  if (!d.telefono) e.telefono = "Escribe un teléfono de contacto.";
  if (!d.estadoResidencia) e.estadoResidencia = "Selecciona tu estado de residencia.";

  if (!d.correoInstitucional) e.correoInstitucional = "Escribe tu correo institucional.";
  else if (!z.string().email().safeParse(d.correoInstitucional).success) {
    e.correoInstitucional = "El correo no es válido.";
  }

  if (!d.universidad) e.universidad = "Escribe el nombre de tu universidad.";
  if (!d.programaEducativo) e.programaEducativo = "Escribe tu programa educativo.";
  if (!d.nivel) e.nivel = "Selecciona el nivel de estudios.";

  const semestre = Number(d.semestre);
  if (!d.semestre) e.semestre = "Indica tu semestre actual.";
  else if (!Number.isInteger(semestre) || semestre < 1 || semestre > 14) {
    e.semestre = "El semestre debe ser un número entre 1 y 14.";
  }

  const promedio = Number(d.promedio);
  if (!d.promedio) e.promedio = "Escribe tu promedio global acumulado.";
  else if (Number.isNaN(promedio) || promedio < 0 || promedio > 10) {
    e.promedio = "El promedio debe estar entre 0 y 10.";
  } else if (promedio < promedioMinimo) {
    // Regla de elegibilidad de la convocatoria, no un formato mal escrito.
    e.promedio = `La convocatoria pide un promedio mínimo de ${promedioMinimo.toFixed(1)}.`;
  }

  if (!d.areaStem) e.areaStem = "Selecciona tu área STEM.";
  if (!d.declaraNoUltimoAnio) {
    e.declaraNoUltimoAnio =
      "Debes declarar que no cursas el último año de tu programa: la convocatoria no admite a quienes lo cursan.";
  }

  if (!d.nombrePropuesta) e.nombrePropuesta = "Escribe el nombre de tu propuesta.";
  if (!d.problema) e.problema = "Describe el problema u oportunidad.";
  if (!d.impacto) e.impacto = "Describe el impacto social esperado.";

  return e;
}

export async function guardarDatos(
  _previo: EstadoGuardado,
  datos: FormData,
): Promise<EstadoGuardado> {
  let contexto;
  try {
    contexto = await borradorEditable();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar." };
  }

  const { app, edicion } = contexto;
  const modo = String(datos.get("modo") ?? "parcial");

  const parseo = EsquemaDatos.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return { error: "Hay campos con un formato que el servidor no reconoce." };
  }
  const d = parseo.data;

  if (modo === "validar") {
    const errores = validarDatos(d, edicion.promedioMinimo);
    if (Object.keys(errores).length > 0) return { errores };
  }

  const guardadaEn = new Date();

  // Se guarda el nombre tal como lo escribió y, aparte, la coincidencia con el
  // catálogo ANUIES. Cuando no hay coincidencia la postulación sigue su curso:
  // el catálogo sirve para filtrar y para avisar, no para rechazar.
  const universidadId = await reconocerUniversidad(d.universidad);

  await db.application.update({
    where: { id: app.id },
    data: {
      universidadId,
      datos: {
        nombreCompleto: d.nombreCompleto || null,
        curp: d.curp || null,
        fechaNacimiento: d.fechaNacimiento ? new Date(`${d.fechaNacimiento}T12:00:00Z`) : null,
        telefono: d.telefono || null,
        estadoResidencia: d.estadoResidencia || null,
        correoInstitucional: d.correoInstitucional || null,
      },
      academicos: {
        universidad: d.universidad || null,
        programaEducativo: d.programaEducativo || null,
        nivel: d.nivel || null,
        semestre: d.semestre ? Number(d.semestre) : null,
        promedio: d.promedio ? Number(d.promedio) : null,
        areaStem: d.areaStem || null,
        declaraNoUltimoAnio: Boolean(d.declaraNoUltimoAnio),
      },
      propuesta: {
        nombre: d.nombrePropuesta || null,
        // La tecnología ya no se le pregunta a la aplicante: la clasifica la
        // evaluación por IA a partir de la propuesta escrita. Se conserva lo
        // que hubiera para no perderlo al guardar.
        tecnologia: app.propuesta?.tecnologia ?? null,
        problema: d.problema || null,
        impacto: d.impacto || null,
      },
      guardadaEn,
    },
  });

  revalidatePath("/aplicacion", "layout");
  revalidatePath("/dashboard");

  return { ok: true, guardadaEn: guardadaEn.toISOString() };
}

/** Envío definitivo. Vuelve a comprobar todo contra la base: el checklist que
 *  ve la aplicante es informativo, esta función es la que decide. */
export async function enviarAplicacion(
  _previo: EstadoGuardado,
  datos: FormData,
): Promise<EstadoGuardado> {
  let contexto;
  try {
    contexto = await borradorEditable();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo enviar." };
  }

  const { app, usuario } = contexto;

  if (!datos.get("declaraVeracidad")) {
    return { error: "Debes declarar que la información y los documentos son verídicos." };
  }

  const conDeclaracion = { ...app, declaraVeracidad: true };

  if (!puedeEnviar(conDeclaracion)) {
    return {
      error: `Todavía falta: ${faltantesParaEnviar(conDeclaracion).join(" ")}`,
    };
  }

  const enviadaEn = new Date();
  await db.application.update({
    where: { id: app.id },
    data: { estado: "submitted", declaraVeracidad: true, enviadaEn },
  });

  // La evaluación por IA se encola al enviar; el panel de administración
  // muestra las pendientes y permite reintentarlas por lote.
  await db.aiEvaluation.upsert({
    where: { applicationId: app.id },
    create: { applicationId: app.id, estado: "pending" },
    update: { estado: "pending" },
  });

  await registrar({
    accion: "aplicacion.enviada",
    actorId: usuario.id,
    entidad: "Application",
    entidadId: app.id,
    detalle: { folio: app.folio },
  });

  revalidatePath("/aplicacion", "layout");
  revalidatePath("/dashboard");

  return { ok: true, guardadaEn: enviadaEn.toISOString() };
}
