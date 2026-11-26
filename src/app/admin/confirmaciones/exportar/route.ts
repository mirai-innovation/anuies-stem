import { sesionActual } from "@/lib/sesion";
import { seleccionadas } from "@/lib/confirmaciones";
import { registrar } from "@/lib/bitacora";
import { fechaHora } from "@/lib/fechas";

/** Mismo criterio que /api/exportar: se antepone un apóstrofo a lo que Excel
 *  interpretaría como fórmula. */
function celda(v: unknown) {
  const s = v == null ? "" : String(v);
  const seguro = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${seguro.replace(/"/g, '""')}"`;
}

const ESTADOS = { confirmada: "Confirmada", pendiente: "Pendiente", declinada: "Declinó" };

const COLUMNAS = [
  "Folio",
  "Nombre",
  "Correo",
  "Universidad",
  "Estado",
  "Respondió",
  "Ciudad de origen",
  "Talla",
  "Requerimientos alimentarios",
  "Contacto de emergencia",
];

/** Lista logística de seleccionadas. Solo admin: lleva contactos de
 *  emergencia y requerimientos alimentarios. */
export async function GET() {
  const usuario = await sesionActual();
  if (!usuario || usuario.rol !== "admin") return new Response("Sin permiso", { status: 403 });

  const filas = await seleccionadas();

  const lineas = [
    COLUMNAS.map(celda).join(","),
    ...filas.map((f) =>
      [
        f.folio,
        f.nombre,
        f.email,
        f.universidad,
        ESTADOS[f.estado],
        f.respondidoEn ? fechaHora(f.respondidoEn) : "",
        f.ciudadOrigen,
        f.tallaPlayera,
        f.requerimientosAlimentarios,
        f.contactoEmergencia,
      ]
        .map(celda)
        .join(","),
    ),
  ];

  await registrar({
    accion: "confirmaciones.exportadas",
    actorId: usuario.id,
    entidad: "Edicion",
    detalle: { filas: filas.length },
  });

  // BOM para que Excel abra los acentos bien.
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="confirmaciones-anuies4mx.csv"',
      "Cache-Control": "no-store",
    },
  });
}
