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
                  {resultadosPublicados(edicion) ? "Consulta tu resultado" : "Tu aplicación está enviada"}
                </div>
                <p className="mb-5 mt-3 text-[13.5px] leading-relaxed text-gris-claro">
                  {resultadosPublicados(edicion)
                    ? "El comité publicó los dictámenes. Revisa tu puntaje y la retroalimentación."
                    : `Entra al periodo de evaluación (${fechaCorta(edicion.evaluacionInicia)} — ${fechaCorta(edicion.evaluacionTermina)}). Los resultados se publican el ${fechaCorta(edicion.resultadosPublicadosEn ?? edicion.resultadosPrevistos)}.`}
                </p>
                <BotonEnlace href="/resultado" variante="brillante">
                  Ver mi resultado →
                </BotonEnlace>
              </>
            )}
          </Tarjeta>

          <Tarjeta tono="teal">
            <Etiqueta className="mb-3 text-teal-oscuro">Criterios con que serás evaluada</Etiqueta>
            <ol className="m-0 grid list-decimal gap-2 pl-5 text-[13px] leading-snug text-tinta">
              {CRITERIOS.map((c) => (
                <li key={c.clave}>{c.nombre}</li>
              ))}
            </ol>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
