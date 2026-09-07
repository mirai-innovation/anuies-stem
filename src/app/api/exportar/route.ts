import { db } from "@/lib/db";
import { sesionActual, puedeRevisar } from "@/lib/sesion";
import { condiciones, INCLUIR, type FiltrosLista } from "@/lib/lista";
import { DICTAMENES, ESTADOS, NIVELES, TECNOLOGIAS } from "@/lib/constantes";
import { registrar } from "@/lib/bitacora";
import { fechaHora } from "@/lib/fechas";

/** Escapa un valor para CSV. Se antepone un apóstrofo a lo que empiece con
 *  =, +, - o @ porque Excel interpretaría esa celda como fórmula. */
function celda(v: unknown) {
  const s = v == null ? "" : String(v);
  const seguro = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${seguro.replace(/"/g, '""')}"`;
}

const COLUMNAS = [
  "Folio",
  "Aplicante",
  "Correo institucional",
  "Universidad",
  "Programa",
  "Nivel",
  "Semestre",
  "Promedio",
  "Área STEM",
  "Propuesta",
  "Tecnología",
  "Estado",
  "Puntaje comité",
  "Dictamen",
  "Enviada",
];

export async function GET(req: Request) {
  const usuario = await sesionActual();
  if (!usuario || !puedeRevisar(usuario.rol)) {
    return new Response("Sin permiso", { status: 403 });
  }

  const url = new URL(req.url);
  const filtros: FiltrosLista = {
    q: url.searchParams.get("q") ?? undefined,
    estado: url.searchParams.get("estado") ?? undefined,
    universidad: url.searchParams.get("universidad") ?? undefined,
    tecnologia: url.searchParams.get("tecnologia") ?? undefined,
  };

  const filas = await db.application.findMany({
    where: condiciones(filtros),
    include: INCLUIR,
    orderBy: [{ puntajeComite: "desc" }, { folio: "asc" }],
  });

  // La CURP no se exporta a propósito. Un CSV se reenvía por correo y termina
  // en carpetas compartidas; el identificador oficial de cada aplicante no
  // tiene por qué viajar así. Sigue disponible en el detalle, que exige sesión.
  const lineas = [
    COLUMNAS.map(celda).join(","),
    ...filas.map((a) =>
      [
        a.folio,
        a.datos?.nombreCompleto,
        a.datos?.correoInstitucional,
        a.universidad?.nombre,
        a.academicos?.programaEducativo,
        a.academicos?.nivel ? NIVELES[a.academicos.nivel] : "",
        a.academicos?.semestre,
        a.academicos?.promedio,
        a.academicos?.areaStem,
        a.propuesta?.nombre,
        a.propuesta?.tecnologia ? TECNOLOGIAS[a.propuesta.tecnologia] : "",
        ESTADOS[a.estado],
        a.puntajeComite,
        a.dictamen ? DICTAMENES[a.dictamen] : "",
        a.enviadaEn ? fechaHora(a.enviadaEn) : "",
      ].map(celda).join(","),
    ),
  ];

  await registrar({
    accion: "aplicaciones.exportadas",
    actorId: usuario.id,
    entidad: "Application",
    detalle: { filas: filas.length, filtros: JSON.stringify(filtros) },
  });

  const nombre = `aplicaciones-anuies4mx-${new Date().toISOString().slice(0, 10)}.csv`;

  // El BOM hace que Excel en Windows abra el archivo como UTF-8 y no rompa
  // los acentos.
  return new Response(`﻿${lineas.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
    },
  });
}
