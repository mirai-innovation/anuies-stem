import Link from "next/link";
import type { Edicion } from "@prisma/client";
import { recepcionAbierta } from "@/lib/edicion";
import { diasPara, fecha, fechaCorta } from "@/lib/fechas";
import { BotonEnlace, Chip, Etiqueta, Titulo } from "@/components/ui";
import {
  ACERCA,
  BECA,
  COMPONENTES,
  CORREO_CONTACTO,
  CRITERIOS_SELECCION,
  DATOS,
  DESTACADO,
  DIAS,
  REQUISITOS_EXPEDIENTE,
  REQUISITOS_POSTULAR,
  SECCIONES,
} from "./secciones";

/** Portada pública de la convocatoria.
 *
 *  Es la adaptación del documento original al sistema visual de la
 *  plataforma: misma paleta, mismas tipografías, mismos bordes de 1px sin
 *  esquinas redondeadas. Lo que cambia es que las fechas ya no están escritas
 *  en el HTML: salen de la edición guardada, así que mover el cierre en el
 *  panel de administración también mueve lo que lee quien entra por primera
 *  vez. */

function Encabezado({ num, eyebrow, titulo }: (typeof SECCIONES)[number]) {
  return (
    <div className="mb-8">
      <Etiqueta className="tracking-[0.14em]">
        <span className="text-rosa">{num}</span> — {eyebrow}
      </Etiqueta>
      <Titulo className="mt-2 text-[clamp(30px,4vw,44px)]">
        {titulo}
      </Titulo>
    </div>
  );
}

function Seccion({
  indice,
  alterna,
  children,
}: {
  indice: number;
  alterna?: boolean;
  children: React.ReactNode;
}) {
  const s = SECCIONES[indice];
  return (
    <section
      id={s.id}
      className={`scroll-mt-20 border-t border-linea ${alterna ? "bg-fondo" : "bg-superficie"}`}
    >
      <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8 lg:px-12">
        <Encabezado {...s} />
        {children}
      </div>
    </section>
  );
}

export function Portada({
  edicion,
  sesion,
}: {
  edicion: Edicion;
  sesion: { nombre: string; destino: string } | null;
}) {
  const abierta = recepcionAbierta(edicion);
  const dias = diasPara(edicion.cierreRecepcion);

  const hechos = [
    ["Duración", "5 días intensivos"],
    ["Sede", "Valle de Bravo, México"],
    ["Organiza", "ANUIES × Mirai Innovation"],
    ["Dirigido a", "Mujeres STEM · Universidades ANUIES"],
  ];

  const cronograma: { fecha: string; etapa: string; nota?: string; evento?: boolean }[] = [
    { fecha: fechaCorta(edicion.lanzamiento), etapa: "Lanzamiento de la convocatoria" },
    {
      fecha: `${fechaCorta(edicion.lanzamiento)} — ${fechaCorta(edicion.cierreRecepcion)}`,
      etapa: "Periodo de recepción de aplicaciones",
    },
    {
      fecha: fechaCorta(edicion.cierreRecepcion),
      etapa: "Cierre de la convocatoria",
      nota: "23:59 hrs. CST",
    },
    {
      fecha: `${fechaCorta(edicion.evaluacionInicia)} — ${fechaCorta(edicion.evaluacionTermina)}`,
      etapa: "Evaluación de aplicaciones",
    },
    {
      fecha: fechaCorta(edicion.resultadosPublicadosEn ?? edicion.resultadosPrevistos),
      etapa: "Publicación de resultados",
    },
    {
      fecha: `${fechaCorta(edicion.confirmacionAbre)} — ${fechaCorta(edicion.confirmacionCierra)}`,
      etapa: "Confirmación de participación",
    },
    {
      fecha: `${fechaCorta(edicion.eventoInicia)} — ${fechaCorta(edicion.eventoTermina)}`,
      etapa: "Reto ANUIES4MX · evento presencial",
      nota: "Valle de Bravo, Estado de México",
      evento: true,
    },
  ];

  const postular = abierta ? (
    <BotonEnlace href="/registro" className="px-7 py-4">
      Postúlate ahora →
    </BotonEnlace>
  ) : (
    <BotonEnlace href="/login" variante="secundario" className="px-7 py-4">
      Recepción cerrada · Entrar
    </BotonEnlace>
  );

  return (
    <div className="bg-superficie">
      {/* ---------------- Cabecera ---------------- */}
      <header className="sticky top-0 z-30 border-b border-linea bg-superficie/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8 lg:px-12">
          <Link href="/" className="no-underline hover:no-underline">
            <div className="font-titulo text-[22px] font-extrabold uppercase leading-[0.95] text-tinta">
              ANUIES<span className="text-rosa">4MX</span>
            </div>
            <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-gris">
              Mujeres en STEM · {edicion.clave}
            </div>
          </Link>

          <nav aria-label="Secciones de la convocatoria" className="hidden lg:block">
            <ul className="m-0 flex list-none gap-0 p-0 font-mono text-[11px] text-gris">
              {SECCIONES.map((s) => (
                <li key={s.id} className="border-r border-linea last:border-r-0">
                  <a href={`#${s.id}`} className="px-2.5 py-1 text-gris no-underline hover:text-rosa">
                    {s.indice}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-wrap items-center gap-2.5">
            {sesion ? (
              <BotonEnlace href={sesion.destino} variante="secundario">
                Ir a mi panel
              </BotonEnlace>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-2 font-mono text-[11px] uppercase tracking-[0.08em] text-tinta no-underline hover:text-rosa hover:no-underline"
                >
                  Iniciar sesión
                </Link>
                {abierta && <BotonEnlace href="/registro">Postularme</BotonEnlace>}
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- Portada ---------------- */}
      <section className="relative overflow-hidden border-b border-linea">
        {/* Retícula tenue del documento original. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(#26212E 1px, transparent 1px), linear-gradient(90deg, #26212E 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative mx-auto max-w-[1120px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <Etiqueta className="tracking-[0.14em]">Reto ANUIES4MX</Etiqueta>
          <h1 className="mt-3.5 font-titulo text-[clamp(42px,8vw,86px)] font-extrabold uppercase leading-[0.92] text-tinta">
            Convocatoria ANUIES4MX {edicion.clave}
            <br />
            <span className="text-rosa">Mujeres STEM</span>
          </h1>
          <p className="mt-2 font-titulo text-[clamp(19px,2.6vw,27px)] font-medium text-gris">
            Negocios del Futuro con Tecnologías Emergentes
          </p>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-tinta text-pretty">
            Programa intensivo para mujeres en STEM que aspiran a fundar tech startups. Cinco días
            para convertir una idea en un prototipo, combinando fundamentos de negocio con
            Inteligencia Artificial, Realidad Virtual y Aumentada, Robótica, Blockchain y Cómputo en
            la Nube, con cierre en un Demo Day ante jurado.
          </p>

          <dl className="mt-9 flex flex-wrap border-y border-linea-fuerte">
            {hechos.map(([k, v]) => (
              <div key={k} className="flex-1 basis-[200px] border-r border-linea py-3.5 pr-4 last:border-r-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-gris">{k}</dt>
                <dd className="m-0 mt-1 font-mono text-[14px] font-medium text-tinta">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            {postular}
            <span className="font-mono text-[12px] text-gris">
              {abierta
                ? `Cierra el ${fecha(edicion.cierreRecepcion)} · 23:59 CST${dias >= 0 ? ` · faltan ${dias} ${dias === 1 ? "día" : "días"}` : ""}`
                : `La recepción cerró el ${fecha(edicion.cierreRecepcion)}.`}
            </span>
          </div>
        </div>
      </section>

      <main>
        {/* 01 · El reto */}
        <Seccion indice={0}>
          <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
            <div className="grid max-w-[64ch] gap-4 text-[15px] leading-relaxed text-tinta">
              {ACERCA.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
              <p className="border-l-2 border-rosa pl-4 font-medium">{DESTACADO}</p>
            </div>

            <dl className="m-0 grid h-fit gap-0 border border-linea bg-fondo p-6">
              {DATOS.map(([k, v]) => (
                <div key={k} className="border-b border-linea py-3 last:border-b-0">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-gris">{k}</dt>
                  <dd className="m-0 mt-1 text-[13.5px] leading-snug text-tinta">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Seccion>

        {/* 02 · Cinco días */}
        <Seccion indice={1} alterna>
          <ol className="m-0 grid list-none gap-3.5 p-0 sm:grid-cols-2 lg:grid-cols-5">
            {DIAS.map(([num, titulo, desc]) => (
              <li key={num} className="border border-linea bg-superficie p-5">
                <div className="font-titulo text-[34px] font-extrabold leading-none text-rosa">
                  {num}
                </div>
                <div className="mt-2.5 text-[14px] font-semibold leading-tight text-tinta">
                  {titulo}
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-gris">{desc}</p>
              </li>
            ))}
          </ol>
        </Seccion>

        {/* 03 · Componentes */}
        <Seccion indice={2}>
          <div className="grid gap-6 lg:grid-cols-2">
            {(
              [
                ["Negocio", COMPONENTES.negocio, "rosa"],
                ["Tecnología", COMPONENTES.tecnologia, "teal"],
              ] as const
            ).map(([titulo, lista, tono]) => (
              <div key={titulo} className="border border-linea bg-fondo p-6">
                <div className="mb-4 flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className={`size-2.5 ${tono === "rosa" ? "bg-rosa" : "bg-teal"}`}
                  />
                  <h3 className="font-titulo text-[26px] font-bold uppercase text-tinta">{titulo}</h3>
                </div>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {lista.map((p) => (
                    <li key={p}>
                      <Chip tono={tono === "rosa" ? "rosa" : "teal"}>{p}</Chip>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Seccion>

        {/* 04 · Cronograma */}
        <Seccion indice={3} alterna>
          <ol className="m-0 grid list-none gap-0 p-0">
            {cronograma.map((c) => (
              <li
                key={c.etapa}
                className={`grid gap-1 border-b border-linea py-4 sm:grid-cols-[220px_1fr] sm:gap-6 ${
                  c.evento ? "bg-rosa-suave px-4" : ""
                }`}
              >
                <span
                  className={`font-mono text-[12px] tracking-[0.06em] ${
                    c.evento ? "font-semibold text-rosa-oscuro" : "text-rosa"
                  }`}
                >
                  {c.fecha}
                </span>
                <span>
                  <span
                    className={`text-[14px] ${c.evento ? "font-semibold text-rosa-oscuro" : "text-tinta"}`}
                  >
                    {c.etapa}
                  </span>
                  {c.nota && (
                    <span className="mt-0.5 block font-mono text-[11px] text-gris">{c.nota}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </Seccion>

        {/* 05 · Sede */}
        <Seccion indice={4}>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["/landing/valle-de-bravo.jpg", "FIG. 01", "Valle de Bravo, Estado de México"],
                ["/landing/centro-anuies.jpg", "FIG. 02", "Centro de Capacitación ANUIES"],
              ].map(([src, fig, pie]) => (
                <figure key={fig} className="m-0">
                  <img
                    src={src}
                    alt={pie}
                    loading="lazy"
                    className="block aspect-[4/3] w-full border border-linea object-cover"
                  />
                  <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-gris">
                    <span className="text-rosa">{fig}</span> {pie}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="border border-linea bg-fondo p-6">
              <div className="font-mono text-[11px] tracking-[0.06em] text-teal">
                19.1936° N · 100.1308° W
              </div>
              <h3 className="mt-3 font-titulo text-[28px] font-bold uppercase leading-tight text-tinta">
                Centro de Capacitación ANUIES
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-gris">
                Valle de Bravo, Estado de México. El programa se desarrolla en modalidad presencial
                y residencial durante los cinco días del evento, del{" "}
                {fecha(edicion.eventoInicia, "d")} al {fecha(edicion.eventoTermina)}.
              </p>
            </div>
          </div>
        </Seccion>

        {/* 06 · Requisitos */}
        <Seccion indice={5} alterna>
          <p className="mb-8 max-w-[70ch] text-[15px] leading-relaxed text-tinta text-pretty">
            Identifica una oportunidad o un problema que pueda resolverse con tecnología emergente
            y presenta tu propuesta de negocio en un <strong>video de hasta 90 segundos</strong>.
          </p>

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <Etiqueta className="mb-4">Criterios de selección</Etiqueta>
              <ol className="m-0 grid list-none gap-3.5 p-0">
                {CRITERIOS_SELECCION.map(([titulo, desc], i) => (
                  <li key={titulo} className="grid grid-cols-[28px_1fr] gap-3">
                    <span className="font-mono text-[12px] text-rosa">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong className="text-[13.5px] text-tinta">{titulo}</strong>
                      <span className="mt-0.5 block text-[12.5px] leading-relaxed text-gris">
                        {desc}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-6">
              <div>
                <Etiqueta className="mb-4">Para postular</Etiqueta>
                <ol className="m-0 grid list-none gap-2.5 p-0">
                  {REQUISITOS_POSTULAR.map((r, i) => (
                    <li key={r} className="grid grid-cols-[28px_1fr] gap-3 text-[13.5px] text-tinta">
                      <span className="font-mono text-[12px] text-rosa">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 border border-rosa-oscuro bg-rosa-suave p-3 text-[12.5px] leading-relaxed text-rosa-oscuro">
                  <strong>Importante:</strong> las estudiantes que cursan el último año de su
                  programa educativo no serán consideradas en esta convocatoria.
                </p>
              </div>

              <div className="border border-teal-borde bg-teal-suave p-5">
                <Etiqueta className="mb-3 text-teal-oscuro">Si resultas seleccionada</Etiqueta>
                <p className="mb-3 text-[12.5px] leading-relaxed text-tinta">
                  Hasta entonces no necesitas reunir ningún documento. El expediente se integra
                  después de la publicación de resultados:
                </p>
                <ul className="m-0 grid list-disc gap-1.5 pl-5 text-[12.5px] leading-snug text-tinta">
                  {REQUISITOS_EXPEDIENTE.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Seccion>

        {/* 07 · Beca */}
        <Seccion indice={6}>
          <div className="border border-linea bg-tinta p-8 text-tinta-clara">
            <p className="max-w-[70ch] text-[15px] leading-relaxed">{BECA}</p>
          </div>
        </Seccion>
      </main>

      {/* ---------------- Cierre ---------------- */}
      <footer id="contacto" className="border-t border-linea bg-fondo">
        <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8 lg:px-12">
          <Etiqueta className="tracking-[0.14em]">Postulación</Etiqueta>
          <Titulo className="mt-2 text-[clamp(34px,5vw,56px)]">
            ¿Lista para construir
            <br />
            el futuro?
          </Titulo>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            {postular}
            {!sesion && (
              <Link href="/login" className="font-mono text-[12px] uppercase tracking-[0.08em]">
                Ya tengo cuenta
              </Link>
            )}
          </div>

          <div className="mt-10 border-t border-linea pt-6 font-mono text-[11px] leading-relaxed text-gris">
            <div className="text-tinta">Reto ANUIES4MX — Mujeres en STEM</div>
            <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>
            <div className="mt-3">
              Convocatoria Reto ANUIES4MX · Edición Mujeres en STEM · Valle de Bravo, México ·{" "}
              {edicion.clave}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
