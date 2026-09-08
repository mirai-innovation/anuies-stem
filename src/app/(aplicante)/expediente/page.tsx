import { requiereRol } from "@/lib/sesion";
import { edicionActual, expedienteAbierto } from "@/lib/edicion";
import { DOCUMENTOS } from "@/lib/constantes";
import { fecha } from "@/lib/fechas";
import { Aviso, BotonEnlace, Etiqueta, Tarjeta, Titulo } from "@/components/ui";
import { aplicacionDe } from "../aplicacion-actual";
import { ListaDocumentos } from "./lista";

export const metadata = { title: "Mis documentos · Reto ANUIES4MX 2026" };

/** Entrega de documentos oficiales.
 *
 *  Se habilita al enviar la postulación y cierra con la convocatoria. Mandar
 *  el video ya deja a la aplicante participando; los documentos son el
 *  respaldo que el comité necesita para verificar la elegibilidad, y la
 *  evaluación empieza al día siguiente del cierre. */
export default async function Expediente() {
  const usuario = await requiereRol("applicant");
  const edicion = await edicionActual();
  const app = await aplicacionDe(usuario.id);

  const envoltura = (contenido: React.ReactNode) => (
    <div className="max-w-[1000px] px-8 pb-16 pt-10">
      <Etiqueta className="tracking-[0.14em]">Documentos oficiales</Etiqueta>
      <Titulo className="mb-4 mt-1.5 text-[40px]">Mis documentos</Titulo>
      {contenido}
    </div>
  );

  if (!app) {
    return envoltura(
      <Tarjeta>
        <p className="text-sm text-gris">No hay una aplicación registrada con esta cuenta.</p>
      </Tarjeta>,
    );
  }

  // Todavía no envía: la sección existe, pero explicada, no vacía.
  if (app.estado === "draft") {
    return envoltura(
      <Tarjeta>
        <Etiqueta className="mb-3">Se habilita al enviar tu postulación</Etiqueta>
        <p className="max-w-[66ch] text-sm leading-relaxed text-gris">
          Primero completa y envía tu postulación con tus dos videos. En cuanto la mandes quedas
          participando, y aquí se habilita la entrega de estos cinco documentos, que tendrás que
          subir antes del {fecha(edicion.cierreRecepcion)}.
        </p>
        <ul className="mt-4 grid list-disc gap-1.5 pl-5 text-[13px] text-gris">
          {DOCUMENTOS.map((d) => (
            <li key={d.tipo}>{d.nombre}</li>
          ))}
        </ul>
        <p className="mt-4 max-w-[66ch] text-[13px] leading-relaxed text-gris">
          Te los dejamos a la vista desde ahora para que los vayas reuniendo: algunos los emite tu
          universidad y pueden tardar.
        </p>
        <BotonEnlace href="/aplicacion/revision" className="mt-5">
          Ir a revisión y envío →
        </BotonEnlace>
      </Tarjeta>,
    );
  }

  const entregados = new Map(app.documentos.map((d) => [d.tipo, d]));
  const faltan = DOCUMENTOS.filter((d) => !entregados.has(d.tipo)).length;

  if (!expedienteAbierto(edicion)) {
    return envoltura(
      <>
        <div className="mb-6 max-w-[70ch]">
          <Aviso tono={faltan === 0 ? "exito" : "error"}>
            {faltan === 0
              ? `La entrega cerró el ${fecha(edicion.cierreRecepcion)} con tu expediente completo.`
              : `La entrega cerró el ${fecha(edicion.cierreRecepcion)} y tu expediente quedó incompleto. Escribe a la coordinación de la convocatoria cuanto antes.`}
          </Aviso>
        </div>
        <ListaDocumentos
          soloLectura
          cierre={fecha(edicion.cierreRecepcion)}
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
      </>,
    );
  }

  return envoltura(
    <>
      <div className="mb-6 max-w-[72ch]">
        <Aviso tono="exito">
          <strong>Tu postulación ya está enviada: estás participando.</strong> Para que el comité
          pueda verificar tu elegibilidad, sube estos cinco documentos antes del{" "}
          {fecha(edicion.cierreRecepcion)}, cuando cierra la convocatoria.
        </Aviso>
      </div>
      <ListaDocumentos
        cierre={fecha(edicion.cierreRecepcion)}
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
    </>,
  );
}
