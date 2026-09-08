import { requiereRol } from "@/lib/sesion";
import { VIDEOS, etiquetaPaso } from "@/lib/constantes";
import { videosDelPaso } from "@/lib/aplicacion";
import { Etiqueta, Titulo } from "@/components/ui";
import { aplicacionOFalla } from "../../aplicacion-actual";
import { NavPasos } from "../pasos";
import { FormularioPropuesta } from "./formulario";

export const metadata = { title: "Propuesta · Reto ANUIES4MX 2026" };

export default async function PasoPropuesta() {
  const usuario = await requiereRol("applicant");
  const app = await aplicacionOFalla(usuario.id);

  const videos = videosDelPaso("propuesta").map((regla) => {
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
      <Etiqueta className="tracking-[0.14em]">{etiquetaPaso("propuesta")}</Etiqueta>
      <Titulo className="mb-2 mt-1.5 text-[40px]">Propuesta</Titulo>
      <p className="mb-6 max-w-[72ch] text-sm leading-relaxed text-gris text-pretty">
        Describe tu idea por escrito y preséntala en video. Es lo que el comité califica con los
        cinco criterios de la convocatoria.
      </p>
      <NavPasos />
      <FormularioPropuesta
        guardadaEn={app.guardadaEn ? app.guardadaEn.toISOString() : null}
        videos={videos}
        totalVideos={VIDEOS.length}
        inicial={{
          nombrePropuesta: app.propuesta?.nombre ?? "",
          problema: app.propuesta?.problema ?? "",
          impacto: app.propuesta?.impacto ?? "",
        }}
      />
    </>
  );
}
