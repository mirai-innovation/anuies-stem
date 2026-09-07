"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Tecnologia } from "@prisma/client";
import { db } from "@/lib/db";
import { exigeRol } from "@/lib/sesion";
import { TECNOLOGIAS } from "@/lib/constantes";
import { registrar } from "@/lib/bitacora";

export type EstadoEquipo = { ok?: boolean; error?: string; resumen?: string };

const INTEGRANTES_POR_EQUIPO = 4;

export async function crearEquipo(
  _previo: EstadoEquipo,
  datos: FormData,
): Promise<EstadoEquipo> {
  let usuario;
  try {
    usuario = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  const parseo = z
    .object({
      nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres.").max(80),
      tecnologia: z.enum(["ia", "vr_ar", "robotica", "blockchain_web3", "nube"]),
    })
    .safeParse(Object.fromEntries(datos));

  if (!parseo.success) return { error: parseo.error.issues[0].message };

  const equipo = await db.team.create({ data: parseo.data });

  await registrar({
    accion: "equipo.creado",
    actorId: usuario.id,
    entidad: "Team",
    entidadId: equipo.id,
    detalle: { nombre: equipo.nombre },
  });

  revalidatePath("/admin/equipos");
  return { ok: true };
}

export async function asignarIntegrante(
  applicationId: string,
  equipoId: string | null,
): Promise<EstadoEquipo> {
  let usuario;
  try {
    usuario = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  const app = await db.application.findUnique({ where: { id: applicationId } });
  if (!app) return { error: "La aplicación no existe." };

  // Los equipos son para el Demo Day: solo entran quienes fueron
  // seleccionadas y confirmaron o aún no responden.
  if (app.dictamen !== "selected") {
    return { error: "Solo las aplicantes seleccionadas pueden formar equipo." };
  }
  if (app.confirmacion?.estado === "declinada") {
    return { error: "Esa aplicante declinó su lugar." };
  }

  await db.application.update({ where: { id: applicationId }, data: { equipoId } });

  await registrar({
    accion: equipoId ? "equipo.integrante.asignado" : "equipo.integrante.retirado",
    actorId: usuario.id,
    entidad: "Application",
    entidadId: applicationId,
    detalle: { folio: app.folio, equipoId },
  });

  revalidatePath("/admin/equipos");
  return { ok: true };
}

export async function eliminarEquipo(equipoId: string): Promise<EstadoEquipo> {
  let usuario;
  try {
    usuario = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  // Primero se liberan las integrantes: si no, quedarían apuntando a un
  // equipo inexistente.
  await db.application.updateMany({ where: { equipoId }, data: { equipoId: null } });
  await db.team.delete({ where: { id: equipoId } });

  await registrar({
    accion: "equipo.eliminado",
    actorId: usuario.id,
    entidad: "Team",
    entidadId: equipoId,
  });

  revalidatePath("/admin/equipos");
  return { ok: true };
}

/** Sugerencia automática de equipos.
 *
 *  Regla explícita, no un modelo: se agrupa por tecnología emergente —que es
 *  lo que comparten en el Demo Day— y dentro de cada grupo se reparten las
 *  integrantes rotando universidades, para que un equipo no salga entero de la
 *  misma institución. El resultado es reproducible y el admin puede explicar
 *  por qué quedó así, cosa que un modelo generativo no permitiría. Todo queda
 *  editable después. */
export async function sugerirEquipos(): Promise<EstadoEquipo> {
  let usuario;
  try {
    usuario = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  const disponibles = await db.application.findMany({
    where: {
      dictamen: "selected",
      equipoId: null,
      NOT: { confirmacion: { is: { estado: "declinada" } } },
    },
    include: { universidad: { select: { siglas: true } } },
  });

  if (disponibles.length === 0) {
    return { error: "No hay seleccionadas sin equipo por asignar." };
  }

  const porTecnologia = new Map<Tecnologia, typeof disponibles>();
  for (const a of disponibles) {
    const t = a.propuesta?.tecnologia;
    if (!t) continue;
    porTecnologia.set(t, [...(porTecnologia.get(t) ?? []), a]);
  }

  let creados = 0;
  let asignadas = 0;

  for (const [tecnologia, grupo] of porTecnologia) {
    // Se intercalan universidades: se ordena por institución y luego se
    // reparte en rondas, de modo que integrantes consecutivas de la lista
    // caigan en equipos distintos.
    const ordenadas = [...grupo].sort((a, b) =>
      (a.universidad?.siglas ?? "").localeCompare(b.universidad?.siglas ?? ""),
    );

    const cuantos = Math.max(1, Math.ceil(ordenadas.length / INTEGRANTES_POR_EQUIPO));
    const existentes = await db.team.count({ where: { tecnologia } });

    const equipos = [];
    for (let i = 0; i < cuantos; i++) {
      equipos.push(
        await db.team.create({
          data: {
            nombre: `Equipo ${existentes + i + 1} · ${TECNOLOGIAS[tecnologia]}`,
            tecnologia,
          },
        }),
      );
      creados++;
    }

    for (const [i, a] of ordenadas.entries()) {
      await db.application.update({
        where: { id: a.id },
        data: { equipoId: equipos[i % equipos.length].id },
      });
      asignadas++;
    }
  }

  await registrar({
    accion: "equipos.sugeridos",
    actorId: usuario.id,
    entidad: "Team",
    detalle: { creados, asignadas },
  });

  revalidatePath("/admin/equipos");
  return {
    ok: true,
    resumen: `${creados} ${creados === 1 ? "equipo creado" : "equipos creados"} con ${asignadas} integrantes.`,
  };
}
