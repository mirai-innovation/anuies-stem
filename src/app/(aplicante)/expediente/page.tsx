import { requiereRol } from "@/lib/sesion";
import { edicionActual, expedienteAbierto, resultadosPublicados } from "@/lib/edicion";
import { DOCUMENTOS } from "@/lib/constantes";
import { fecha } from "@/lib/fechas";
import { BotonEnlace, Etiqueta, Tarjeta, Titulo } from "@/components/ui";
import { aplicacionDe } from "../aplicacion-actual";
import { ListaDocumentos } from "./lista";

export const metadata = { title: "Integración de expediente · Reto ANUIES4MX 2026" };

/** Integración de expediente.
 *
 *  Es la última etapa y está cerrada hasta que se publican los resultados:
 *  solo las aplicantes seleccionadas entregan documentos oficiales. Pedir
 *  cinco constancias por adelantado a todas las postulantes cargaría de
 *  trámites a quienes no van a ser seleccionadas y a las áreas escolares que
 *  las emiten. */
export default async function Expediente() {
  const usuario = await requiereRol("applicant");
  const edicion = await edicionActual();
  const app = await aplicacionDe(usuario.id);

  const encabezado = (
    <>
      <Etiqueta className="tracking-[0.14em]">Etapa final · Integración de expediente</Etiqueta>
      <Titulo className="mb-4 mt-1.5 text-[40px]">Mi expediente</Titulo>
    </>
  );

  const envoltura = (contenido: React.ReactNode) => (
    <div className="max-w-[1000px] px-8 pb-16 pt-10">
      {encabezado}
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

  if (!resultadosPublicados(edicion)) {
    return envoltura(
      <Tarjeta>
        <Etiqueta className="mb-3">Etapa bloqueada</Etiqueta>
        <p className="max-w-[64ch] text-sm leading-relaxed text-gris">
          El expediente se integra después de la publicación de resultados y solo lo entregan las
          aplicantes seleccionadas. Mientras tanto no necesitas reunir ningún documento: tu
          postulación se evalúa con la propuesta y el video.
        </p>
        <ul className="mt-4 grid list-disc gap-1.5 pl-5 text-[13px] text-gris">
          {DOCUMENTOS.map((d) => (
            <li key={d.tipo}>{d.nombre}</li>
          ))}
        </ul>
        <p className="mt-4 max-w-[64ch] text-[13px] leading-relaxed text-gris">
          Te los dejamos a la vista para que sepas qué se pedirá si resultas seleccionada.
        </p>
        <BotonEnlace href="/dashboard" variante="secundario" className="mt-5">
          Volver a mi convocatoria
        </BotonEnlace>
      </Tarjeta>,
    );
  }

  if (app.dictamen !== "selected") {
    return envoltura(
      <Tarjeta>
        <p className="max-w-[64ch] text-sm leading-relaxed text-gris">
          La integración de expediente es solo para las aplicantes seleccionadas. Puedes consultar
          tu dictamen y la retroalimentación del comité en tu resultado.
        </p>
        <BotonEnlace href="/resultado" variante="secundario" className="mt-5">
          Ver mi resultado
        </BotonEnlace>
      </Tarjeta>,
    );
  }

  if (app.confirmacion?.estado === "declinada") {
    return envoltura(
      <Tarjeta>
        <p className="max-w-[64ch] text-sm leading-relaxed text-gris">
          Declinaste tu lugar, así que no hay expediente que integrar.
        </p>
      </Tarjeta>,
    );
  }

  if (!expedienteAbierto(edicion)) {
    return envoltura(
      <Tarjeta>
        <p className="max-w-[64ch] text-sm leading-relaxed text-gris">
          La entrega de expedientes cerró el {fecha(edicion.eventoInicia)}. Si te falta algún
          documento, escribe a la coordinación de la convocatoria.
        </p>
      </Tarjeta>,
    );
  }

  const entregados = new Map(app.documentos.map((d) => [d.tipo, d]));

  return envoltura(
    <>
      <p className="mb-6 max-w-[70ch] text-sm leading-relaxed text-gris text-pretty">
        Fuiste seleccionada. Para formalizar tu participación necesitamos estos cinco documentos
        oficiales antes del inicio del programa.
      </p>
      <ListaDocumentos
        cierre={fecha(edicion.eventoInicia)}
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
