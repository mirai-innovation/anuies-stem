"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Barra, Boton, Campo, Entrada, Etiqueta, Tarjeta } from "@/components/ui";
import { TAMANO_LOTE } from "@/lib/constantes";
import { enviarLote, enviarPrueba, iniciarEnvio } from "./acciones";

type Variante = "borrador" | "sin_iniciar";
type Mensaje = { tono: "exito" | "error" | "info"; texto: string } | null;

/** Recordatorio de cierre a las aplicantes que no han enviado.
 *
 *  El envío masivo no se puede deshacer, así que se habilita solo después de
 *  mandar una prueba exitosa en esta sesión y pide una confirmación aparte.
 *  Se manda en lotes desde aquí para mostrar el avance y no chocar con el
 *  límite de tiempo de una sola función del servidor. */
export function GestorRecordatorios({
  correoActor,
  configurado,
  abierta,
  cierre,
  horaCierre,
  dias,
  ultimoEnvio,
  previas,
  destinatarias,
  conteos,
}: {
  correoActor: string;
  configurado: boolean;
  abierta: boolean;
  cierre: string;
  horaCierre: string;
  dias: number;
  ultimoEnvio: string | null;
  previas: Record<Variante, { asunto: string; html: string }>;
  destinatarias: { nombre: string; email: string; folio: string | null; faltan: number | null }[];
  conteos: { borrador: number; sinIniciar: number; sinVerificar: number };
}) {
  const router = useRouter();
  const [variante, setVariante] = useState<Variante>("borrador");
  const [correoPrueba, setCorreoPrueba] = useState(correoActor);
  const [probando, iniciarPrueba] = useTransition();
  const [pruebaOk, setPruebaOk] = useState(false);
  const [mensajePrueba, setMensajePrueba] = useState<Mensaje>(null);

  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [avance, setAvance] = useState<{ hechos: number; total: number } | null>(null);
  const [mensajeEnvio, setMensajeEnvio] = useState<Mensaje>(null);
  // Tras un envío completo el botón se bloquea: un segundo clic duplicaría el
  // correo a todas. Para otro envío hay que recargar la página.
  const [terminado, setTerminado] = useState(false);

  const total = destinatarias.length;

  function probar() {
    setMensajePrueba(null);
    iniciarPrueba(async () => {
      const r = await enviarPrueba(correoPrueba, variante);
      if (r.ok) setPruebaOk(true);
      setMensajePrueba(
        r.error ? { tono: "error", texto: r.error } : { tono: "exito", texto: r.resumen ?? "Listo." },
      );
      router.refresh();
    });
  }

  async function enviarTodas() {
    setConfirmando(false);
    setEnviando(true);
    setMensajeEnvio(null);

    const inicio = await iniciarEnvio();
    if (!inicio.ok || !inicio.envioId || !inicio.ids) {
      setMensajeEnvio({ tono: "error", texto: inicio.error ?? "No se pudo iniciar el envío." });
      setEnviando(false);
      return;
    }

    const ids = inicio.ids;
    let enviados = 0;
    let omitidos = 0;
    const fallidos: string[] = [];
    setAvance({ hechos: 0, total: ids.length });

    for (let i = 0; i < ids.length; i += TAMANO_LOTE) {
      const lote = ids.slice(i, i + TAMANO_LOTE);
      let r: Awaited<ReturnType<typeof enviarLote>>;
      try {
        r = await enviarLote(inicio.envioId, lote);
      } catch {
        r = { error: "Se perdió la conexión con el servidor." };
      }
      if (r.error) {
        setMensajeEnvio({
          tono: "error",
          texto: `${r.error} Se detuvo después de ${enviados} correos enviados; el historial muestra hasta dónde llegó.`,
        });
        setEnviando(false);
        router.refresh();
        return;
      }
      enviados += r.enviados ?? 0;
      omitidos += r.omitidos ?? 0;
      fallidos.push(...(r.fallidos ?? []));
      setAvance({ hechos: Math.min(i + TAMANO_LOTE, ids.length), total: ids.length });
    }

    setMensajeEnvio({
      tono: fallidos.length ? "error" : "exito",
      texto:
        `Listo: ${enviados} de ${ids.length} recordatorios enviados.` +
        (omitidos ? ` ${omitidos} se omitieron porque ya enviaron su aplicación.` : "") +
        (fallidos.length ? ` Fallaron: ${fallidos.join(", ")}.` : ""),
    });
    setTerminado(true);
    setEnviando(false);
    router.refresh();
  }

  const bloqueo = terminado
    ? "Envío terminado. Recarga la página si necesitas mandar otro."
    : !configurado
    ? "Falta configurar EMAIL_USER y EMAIL_PASS en el servidor."
    : !abierta
      ? "La recepción ya cerró: el recordatorio ya no aplica."
      : total === 0
        ? "No hay aplicantes pendientes de enviar."
        : !pruebaOk
          ? "Manda primero una prueba exitosa para habilitar el envío."
          : null;

  return (
    <div className="grid gap-6">
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Cierre de recepción",
            value: cierre,
            note: `${horaCierre} h · ${abierta ? (dias <= 0 ? "cierra hoy" : `faltan ${dias} días`) : "cerrada"}`,
          },
          { label: "Con borrador", value: String(conteos.borrador), note: "Reciben lo que les falta" },
          { label: "Sin iniciar", value: String(conteos.sinIniciar), note: "Cuenta creada, sin aplicación" },
          { label: "Excluidas", value: String(conteos.sinVerificar), note: "Correo sin verificar" },
        ].map((k) => (
          <Tarjeta key={k.label} className="p-5">
            <Etiqueta className="text-[9.5px]">{k.label}</Etiqueta>
            <div className="mt-2 font-titulo text-[28px] font-extrabold leading-none">{k.value}</div>
            <div className="mt-1 font-mono text-[10.5px] text-rosa">{k.note}</div>
          </Tarjeta>
        ))}
      </div>

      {!configurado && (
        <Aviso>El correo no está configurado en este servidor: no se puede enviar ni la prueba.</Aviso>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <Tarjeta>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Etiqueta>Vista previa</Etiqueta>
            <div className="flex" role="tablist" aria-label="Versión del correo">
              {(
                [
                  ["borrador", "Con borrador"],
                  ["sin_iniciar", "Sin iniciar"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={variante === v}
                  onClick={() => setVariante(v)}
                  className={`cursor-pointer border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] ${
                    variante === v
                      ? "border-tinta bg-tinta text-tinta-clara"
                      : "border-linea-fuerte bg-superficie text-gris hover:text-tinta"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="mb-3 text-[13px]">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gris">Asunto · </span>
            {previas[variante].asunto}
          </p>
          <iframe
            title="Vista previa del correo"
            srcDoc={previas[variante].html}
            sandbox=""
            className="h-[620px] w-full border border-linea bg-white"
          />
          <p className="mt-2 font-mono text-[10px] text-gris">
            Cada aplicante recibe su nombre y la lista de lo que le falta a su propia aplicación.
          </p>
        </Tarjeta>

        <div className="grid gap-6">
          <Tarjeta>
            <Etiqueta className="mb-3 text-rosa">1 · Enviar prueba</Etiqueta>
            <p className="mb-4 text-[13px] leading-relaxed text-gris">
              Manda la versión «{variante === "borrador" ? "con borrador" : "sin iniciar"}» a una
              sola dirección, marcada como prueba. No le llega a ninguna aplicante.
            </p>
            <div className="grid gap-3">
              <Campo id="correo-prueba" etiqueta="Correo de prueba">
                <Entrada
                  id="correo-prueba"
                  type="email"
                  value={correoPrueba}
                  onChange={(e) => setCorreoPrueba(e.target.value)}
                />
              </Campo>
              <Boton
                type="button"
                variante="oscuro"
                disabled={probando || !configurado || enviando}
                onClick={probar}
              >
                {probando ? "Enviando…" : "Enviar prueba"}
              </Boton>
              {mensajePrueba && <Aviso tono={mensajePrueba.tono}>{mensajePrueba.texto}</Aviso>}
            </div>
          </Tarjeta>

          <Tarjeta tono={pruebaOk && !bloqueo ? "acento" : "clara"}>
            <Etiqueta className="mb-3 text-rosa">2 · Enviar a todas</Etiqueta>
            <p className="mb-4 text-[13px] leading-relaxed text-gris">
              {total} {total === 1 ? "aplicante" : "aplicantes"} sin enviar su aplicación. Antes de
              cada lote se vuelve a revisar: quien ya envió no recibe el correo.
            </p>
            {ultimoEnvio && (
              <p className="mb-4 font-mono text-[10.5px] text-rosa-oscuro">
                Último envío a aplicantes: {ultimoEnvio}.
              </p>
            )}
            {total > 450 && (
              <div className="mb-3">
                <Aviso tono="info">
                  Gmail limita los envíos diarios (500 en cuentas personales, 2,000 en Workspace).
                  Si se rebasa, el resto aparecerá como fallido.
                </Aviso>
              </div>
            )}

            {confirmando ? (
              <div className="grid gap-2.5 border border-rosa p-3.5">
                <span className="text-[12.5px]">
                  Se enviará el recordatorio a {total} {total === 1 ? "aplicante" : "aplicantes"}. No
                  se puede deshacer.
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Boton type="button" onClick={enviarTodas}>
                    Sí, enviar a {total}
                  </Boton>
                  <button
                    type="button"
                    onClick={() => setConfirmando(false)}
                    className="cursor-pointer border-0 bg-transparent font-mono text-[11px] uppercase tracking-[0.08em] text-gris underline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <Boton
                type="button"
                className="w-full"
                disabled={Boolean(bloqueo) || enviando}
                onClick={() => setConfirmando(true)}
              >
                {enviando ? "Enviando…" : `Enviar a ${total}`}
              </Boton>
            )}

            {bloqueo && !enviando && (
              <p className="mt-2 font-mono text-[10.5px] text-gris">{bloqueo}</p>
            )}

            {avance && (
              <div className="mt-4">
                <div className="mb-2 flex justify-between text-[12.5px]">
                  <span>Avance</span>
                  <span className="font-mono text-gris">
                    {avance.hechos} / {avance.total}
                  </span>
                </div>
                <Barra valor={avance.total ? avance.hechos / avance.total : 0} />
              </div>
            )}
            {mensajeEnvio && (
              <div className="mt-4">
                <Aviso tono={mensajeEnvio.tono}>{mensajeEnvio.texto}</Aviso>
              </div>
            )}
          </Tarjeta>
        </div>
      </div>

      <Tarjeta>
        <details>
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.12em] text-gris">
            Ver destinatarias · {total}
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-fondo">
                  {["Nombre", "Correo", "Folio", "Situación"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="border-b border-linea px-4 py-3 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-gris"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {destinatarias.map((d) => (
                  <tr key={d.email} className="border-b border-linea">
                    <td className="px-4 py-2.5">{d.nombre}</td>
                    <td className="px-4 py-2.5 font-mono text-[11.5px] text-gris">{d.email}</td>
                    <td className="px-4 py-2.5 font-mono text-[11.5px]">{d.folio ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gris">
                      {d.faltan === null
                        ? "Sin iniciar"
                        : `Borrador · ${d.faltan} ${d.faltan === 1 ? "pendiente" : "pendientes"}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Tarjeta>
    </div>
  );
}
