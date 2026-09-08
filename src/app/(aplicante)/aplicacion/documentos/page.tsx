import { requiereRol } from "@/lib/sesion";
import { DOCUMENTOS, etiquetaPaso } from "@/lib/constantes";
import { Etiqueta, Titulo } from "@/components/ui";
import { aplicacionOFalla } from "../../aplicacion-actual";
import { NavPasos } from "../pasos";
import { ListaDocumentos } from "./lista";

export const metadata = { title: "Documentos · Reto ANUIES4MX 2026" };

export default async function PasoDocumentos() {
  const usuario = await requiereRol("applicant");
  const app = await aplicacionOFalla(usuario.id);

  const entregados = new Map(app.documentos.map((d) => [d.tipo, d]));

  return (
    <>
      <Etiqueta className="tracking-[0.14em]">{etiquetaPaso("documentos")}</Etiqueta>
      <Titulo className="mb-2 mt-1.5 text-[40px]">Documentos</Titulo>
      <p className="mb-6 max-w-[72ch] text-sm leading-relaxed text-gris text-pretty">
        Los cinco son obligatorios para enviar tu postulación. Algunos los emite tu universidad y
        pueden tardar, así que conviene pedirlos con tiempo.
      </p>
      <NavPasos />
      <ListaDocumentos
        guardadaEn={app.guardadaEn ? app.guardadaEn.toISOString() : null}
        documentos={DOCUMENTOS.map((d) => {
          const sub = entregados.get(d.tipo);
          return {
            tipo: d.tipo,
            nombre: d.nombre,
            ayuda: d.ayuda,
            subido: sub
              ? {
                  nombreOriginal: sub.nombreOriginal,
                  tamanoBytes: sub.tamanoBytes,
                  subidoEn: sub.subidoEn.toISOString(),
                }
              : null,
          };
        })}
      />
    </>
  );
}
