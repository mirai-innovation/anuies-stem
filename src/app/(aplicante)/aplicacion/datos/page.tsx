import { requiereRol } from "@/lib/sesion";
import { db } from "@/lib/db";
import { edicionActual } from "@/lib/edicion";
import { VIDEOS, etiquetaPaso } from "@/lib/constantes";
import { videosDelPaso } from "@/lib/aplicacion";
import { Etiqueta, Titulo } from "@/components/ui";
import { aplicacionOFalla } from "../../aplicacion-actual";
import { NavPasos } from "../pasos";
import { FormularioDatos } from "./formulario";

export const metadata = { title: "Datos personales y académicos · Reto ANUIES4MX 2026" };

export default async function PasoDatos() {
  const usuario = await requiereRol("applicant");
  const app = await aplicacionOFalla(usuario.id);
  const edicion = await edicionActual();

  // El catálogo no restringe la captura: alimenta las sugerencias, que se
  // acotan al estado que elija la aplicante.
  const universidades = await db.universidad.findMany({
    where: { activa: true },
    orderBy: { nombre: "asc" },
    select: { nombre: true, estado: true },
  });

  const estados = [...new Set(universidades.map((u) => u.estado))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );

  const videos = videosDelPaso("datos").map((regla) => {
    const sub = app.videos.find((v) => v.tipo === regla.tipo);
    return {
      tipo: regla.tipo,
      nombre: regla.nombre,
      ayuda: regla.ayuda,
      puntos: [...regla.puntos],
      nota: regla.nota ?? null,
      maxSegundos: regla.maxSegundos,
      obligatorio: regla.obligatorio,
      subido: sub
        ? {
            nombreOriginal: sub.nombreOriginal,
            tamanoBytes: sub.tamanoBytes,
            duracionSegundos: sub.duracionSegundos,
            resumen: sub.resumen ?? "",
          }
        : null,
    };
  });

  return (
    <>
      <Etiqueta className="tracking-[0.14em]">{etiquetaPaso("datos")}</Etiqueta>
      <Titulo className="mb-6 mt-1.5 text-[40px]">Datos personales y académicos</Titulo>
      <NavPasos />
      <FormularioDatos
        universidades={universidades}
        estados={estados}
        promedioMinimo={edicion.promedioMinimo}
        guardadaEn={app.guardadaEn ? app.guardadaEn.toISOString() : null}
        videos={videos}
        totalVideos={VIDEOS.length}
        inicial={{
          nombreCompleto: app.datos?.nombreCompleto ?? usuario.nombre,
          curp: app.datos?.curp ?? "",
          fechaNacimiento: app.datos?.fechaNacimiento
            ? app.datos.fechaNacimiento.toISOString().slice(0, 10)
            : "",
          telefono: app.datos?.telefono ?? "",
          correoInstitucional: app.datos?.correoInstitucional ?? usuario.email,
          estadoUniversidad: app.academicos?.estadoUniversidad ?? "",
          universidad: app.academicos?.universidad ?? "",
          programaEducativo: app.academicos?.programaEducativo ?? "",
          nivel: app.academicos?.nivel ?? "",
          semestre: app.academicos?.semestre ? String(app.academicos.semestre) : "",
          promedio: app.academicos?.promedio != null ? String(app.academicos.promedio) : "",
          declaraNoUltimoAnio: app.academicos?.declaraNoUltimoAnio ?? false,
        }}
      />
    </>
  );
}
