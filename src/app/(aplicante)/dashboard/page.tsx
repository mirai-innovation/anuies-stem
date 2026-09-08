import Link from "next/link";
import { requiereRol } from "@/lib/sesion";
import { edicionActual, recepcionAbierta, resultadosPublicados } from "@/lib/edicion";
import { avance, faltantesParaEnviar, pasoCompleto } from "@/lib/aplicacion";
import { CRITERIOS, PASOS, nombreDePila } from "@/lib/constantes";
import { diasPara, fecha, fechaCorta } from "@/lib/fechas";
import { Barra, BotonEnlace, Chip, Etiqueta, Tarjeta, Titulo } from "@/components/ui";
import { aplicacionDe } from "../aplicacion-actual";
import { Cronologia } from "./cronologia";

export const metadata = { title: "Mi convocatoria · Reto ANUIES4MX 2026" };

export default async function Dashboard() {
  const usuario = await requiereRol("applicant");
  const edicion = await edicionActual();
  const app = await aplicacionDe(usuario.id);

  const abierta = recepcionAbierta(edicion);
  const dias = diasPara(edicion.cierreRecepcion);
  const primerNombre = nombreDePila(usuario.nombre);

  // Sin aplicacion solo se llega si la recepcion cerro y nunca se creo el
  // borrador: no hay nada que completar, solo explicarlo.
  if (!app) {
    return (
      <div className="max-w-[1080px] px-8 pb-16 pt-10">
        <Etiqueta>Mi convocatoria</Etiqueta>
        <Titulo className="mt-1.5 text-[40px]">Hola, {primerNombre}</Titulo>
        <Tarjeta className="mt-7">
          <Etiqueta>Recepción cerrada</Etiqueta>
          <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-gris">
            El periodo de recepcion cerro el {fecha(edicion.cierreRecepcion)} a las
            23:59 CST y no se registro una aplicacion con esta cuenta. Te
            esperamos en la siguiente edicion.
          </p>
        </Tarjeta>
      </div>
    );
  }

  const { completos, total, fraccion } = avance(app);
  const pendiente = PASOS.find((p) => !pasoCompleto(app, p.slug));
  const faltantes = faltantesParaEnviar(app);

  return (
    <div className="max-w-[1080px] px-8 pb-16 pt-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Etiqueta className="tracking-[0.14em]">Mi convocatoria</Etiqueta>
          <Titulo className="mt-1.5 text-[40px]">Hola, {primerNombre}</Titulo>
        </div>
        <div className="bg-tinta px-4 py-3 font-mono text-[11px] tracking-[0.06em] text-tinta-clara">
          {abierta
            ? `Cierra en ${dias} ${dias === 1 ? "día" : "días"} · ${fechaCorta(edicion.cierreRecepcion)}`
            : `Recepción cerrada · ${fechaCorta(edicion.cierreRecepcion)}`}
        </div>
      </div>

      <Tarjeta className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Etiqueta>Avance de mi aplicación</Etiqueta>
          <div className="font-mono text-[13px] font-semibold text-rosa">
            {completos} de {total} secciones · {Math.round(fraccion * 100)}%
          </div>
        </div>
        <div className="my-4 mb-5">
          <Barra valor={fraccion} />
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((p) => {
            const listo = pasoCompleto(app, p.slug);
            return (
              <Link
                key={p.slug}
                href={`/aplicacion/${p.slug}`}
                className="block border border-linea bg-fondo p-4 no-underline hover:border-rosa hover:no-underline"
              >
                <div className="font-mono text-[10px] tracking-[0.1em] text-gris">{p.num}</div>
                <div className="my-2 mb-2.5 text-sm font-semibold leading-tight text-tinta">
                  {p.label}
                </div>
                <Chip tono={listo ? "teal" : "rosa"}>{listo ? "Completo" : "Pendiente"}</Chip>
              </Link>
            );
          })}
        </div>
      </Tarjeta>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Tarjeta>
          <Etiqueta className="mb-5">Estado de mi postulación</Etiqueta>
          <Cronologia
            app={app}
            edicion={edicion}
            publicados={resultadosPublicados(edicion)}
          />
        </Tarjeta>

        <div className="grid gap-6">
          <Tarjeta tono="oscura">
            <Etiqueta className="mb-3 text-gris-claro">Siguiente acción</Etiqueta>
            {app.estado === "draft" && pendiente ? (
              <>
                <div className="font-titulo text-[26px] font-bold uppercase leading-tight">
                  {pendiente.slug === "revision"
                    ? "Revisa y envía tu aplicación"
                    : `Completa: ${pendiente.label}`}
                </div>
                <p className="mb-5 mt-3 text-[13.5px] leading-relaxed text-gris-claro">
                  {faltantes.length > 0
                    ? faltantes[0]
                    : "Todo está completo. Revisa el resumen y envía tu aplicación."}
                </p>
                <BotonEnlace href={`/aplicacion/${pendiente.slug}`} variante="brillante">
                  Ir al {pendiente.num.toLowerCase()} →
                </BotonEnlace>
              </>
            ) : (
              <>
                <div className="font-titulo text-[26px] font-bold uppercase leading-tight">
                  {resultadosPublicados(edicion) ? "Consulta tu resultado" : "Ya estás participando"}
                </div>
                <p className="mb-5 mt-3 text-[13.5px] leading-relaxed text-gris-claro">
                  {resultadosPublicados(edicion)
                    ? "El comité publicó los dictámenes. Revisa tu puntaje y la retroalimentación."
                    : `Tu postulación quedó registrada y completa. La evaluación corre del ${fechaCorta(edicion.evaluacionInicia)} al ${fechaCorta(edicion.evaluacionTermina)}.`}
                </p>
                <BotonEnlace href="/resultado" variante="brillante">
                  Ver mi resultado →
                </BotonEnlace>
              </>
            )}
          </Tarjeta>

          {/* Antes de enviar interesan los criterios, que sirven para armar la
              propuesta. Después ya no son accionables: lo que hace falta saber
              es qué viene, y sobre todo que los documentos se piden más
              adelante y solo si resulta seleccionada. */}
          {app.estado === "draft" ? (
            <Tarjeta tono="teal">
              <Etiqueta className="mb-3 text-teal-oscuro">Criterios con que serás evaluada</Etiqueta>
              <ol className="m-0 grid list-decimal gap-2 pl-5 text-[13px] leading-snug text-tinta">
                {CRITERIOS.map((c) => (
                  <li key={c.clave}>{c.nombre}</li>
                ))}
              </ol>
            </Tarjeta>
          ) : (
            <Tarjeta tono="teal">
              <Etiqueta className="mb-4 text-teal-oscuro">Qué sigue</Etiqueta>
              <ol className="m-0 grid list-none gap-4 p-0">
                {[
                  {
                    n: "01",
                    titulo: "Evaluación del comité",
                    texto: `Del ${fechaCorta(edicion.evaluacionInicia)} al ${fechaCorta(edicion.evaluacionTermina)}. No tienes que hacer nada durante este periodo.`,
                  },
                  {
                    n: "02",
                    titulo: "Publicación de resultados",
                    texto: `El ${fechaCorta(edicion.resultadosPublicadosEn ?? edicion.resultadosPrevistos)} podrás ver tu dictamen, tu puntaje por criterio y la retroalimentación del comité.`,
                  },
                  {
                    n: "03",
                    titulo: "Si resultas seleccionada",
                    texto: `Confirmas tu participación del ${fechaCorta(edicion.confirmacionAbre)} al ${fechaCorta(edicion.confirmacionCierra)}, y en diciembre nos vemos en Valle de Bravo.`,
                  },
                ].map((p) => (
                  <li key={p.n} className="grid grid-cols-[26px_1fr] gap-3">
                    <span className="font-mono text-[12px] text-teal-oscuro">
                      {p.n}
                    </span>
                    <div>
                      <div className="text-[13.5px] font-semibold text-tinta">{p.titulo}</div>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-tinta/85">{p.texto}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Tarjeta>
          )}
        </div>
      </div>
    </div>
  );
}
