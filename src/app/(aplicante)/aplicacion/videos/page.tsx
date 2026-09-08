import { requiereRol } from "@/lib/sesion";
import { VIDEOS, etiquetaPaso } from "@/lib/constantes";
import { Etiqueta, Titulo } from "@/components/ui";
import { aplicacionOFalla } from "../../aplicacion-actual";
import { NavPasos } from "../pasos";
import { ListaVideos } from "./lista";

export const metadata = { title: "Videos · Reto ANUIES4MX 2026" };

export default async function PasoVideos() {
  const usuario = await requiereRol("applicant");
  const app = await aplicacionOFalla(usuario.id);

  const subidos = new Map(app.videos.map((v) => [v.tipo, v]));

  return (
    <>
      <Etiqueta className="tracking-[0.14em]">{etiquetaPaso("videos")}</Etiqueta>
      <Titulo className="mb-2 mt-1.5 text-[40px]">Videos</Titulo>
      <p className="mb-6 max-w-[72ch] text-sm leading-relaxed text-gris text-pretty">
        Son dos videos y evalúan cosas distintas: el primero, quién eres y qué te mueve; el
        segundo, tu propuesta. Grábalos por separado.
      </p>
      <NavPasos />
      <ListaVideos
        guardadaEn={app.guardadaEn ? app.guardadaEn.toISOString() : null}
        videos={VIDEOS.map((v) => {
          const sub = subidos.get(v.tipo);
          return {
            tipo: v.tipo,
            nombre: v.nombre,
            ayuda: v.ayuda,
            puntos: [...v.puntos],
            nota: v.nota ?? null,
            maxSegundos: v.maxSegundos,
            obligatorio: v.obligatorio,
            subido: sub
              ? {
                  nombreOriginal: sub.nombreOriginal,
                  tamanoBytes: sub.tamanoBytes,
                  duracionSegundos: sub.duracionSegundos,
                  resumen: sub.resumen ?? "",
                }
              : null,
          };
        })}
      />
    </>
  );
}
