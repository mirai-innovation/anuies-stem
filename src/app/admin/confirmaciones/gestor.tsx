"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Barra, Boton, Campo, Chip, Entrada, Etiqueta, Tarjeta } from "@/components/ui";
import { TAMANO_LOTE } from "@/lib/constantes";
import {
  enviarLoteConfirmacion,
  enviarPruebaConfirmacion,
  iniciarEnvioConfirmacion,
} from "./acciones";

type Estado = "confirmada" | "pendiente" | "declinada";
type Filtro = "todas" | Estado;
type Mensaje = { tono: "exito" | "error" | "info"; texto: string } | null;

type Fila = {
  folio: string;
  nombre: string;
  email: string;
  universidad: string;
  estado: Estado;
  respondido: string | null;
  ciudad: string | null;
  talla: string | null;
  alimentos: string | null;
  emergencia: string | null;
};

const CHIP: Record<Estado, { texto: string; tono: "teal" | "rosa" | "gris" }> = {
  confirmada: { texto: "Confirmada", tono: "teal" },
  pendiente: { texto: "Pendiente", tono: "rosa" },
  declinada: { texto: "Declinó", tono: "gris" },
};

/** Seguimiento de confirmaciones y recordatorio a las pendientes.
 *
 *  Igual que el recordatorio de cierre: el envío masivo se habilita solo tras
 *  una prueba exitosa en esta sesión, pide confirmación aparte y se manda en
 *  lotes para mostrar avance y no rebasar el tiempo de una función. */
export function GestorConfirmaciones({
  correoActor,
  configurado,
  abierta,
  antes,
  cierra,
  horaCierre,
  dias,
  ultimoEnvio,
  previa,
  filas,
}: {
  correoActor: string;
  configurado: boolean;
  abierta: boolean;
  antes: boolean;
  cierra: string;
  horaCierre: string;
  dias: number;
  ultimoEnvio: string | null;
  previa: { asunto: string; html: string };
  filas: Fila[];
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [abierto, setAbierto] = useState<string | null>(null);

  const [correoPrueba, setCorreoPrueba] = useState(correoActor);
  const [probando, iniciarPrueba] = useTransition();
  const [pruebaOk, setPruebaOk] = useState(false);
  const [mensajePrueba, setMensajePrueba] = useState<Mensaje>(null);

  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [avance, setAvance] = useState<{ hechos: number; total: number } | null>(null);
  const [mensajeEnvio, setMensajeEnvio] = useState<Mensaje>(null);
  const [terminado, setTerminado] = useState(false);

  const conteo = {
    todas: filas.length,
    confirmada: filas.filter((f) => f.estado === "confirmada").length,
    pendiente: filas.filter((f) => f.estado === "pendiente").length,
    declinada: filas.filter((f) => f.estado === "declinada").length,
  };
  const visibles = filtro === "todas" ? filas : filas.filter((f) => f.estado === filtro);
  const pendientes = conteo.pendiente;

  function probar() {
    setMensajePrueba(null);
    iniciarPrueba(async () => {
      const r = await enviarPruebaConfirmacion(correoPrueba);
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

    const inicio = await iniciarEnvioConfirmacion();
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
      let r: Awaited<ReturnType<typeof enviarLoteConfirmacion>>;
      try {
        r = await enviarLoteConfirmacion(inicio.envioId, lote);
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
        (omitidos ? ` ${omitidos} se omitieron porque ya respondieron.` : "") +
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
        ? antes
          ? "La ventana de confirmación todavía no abre."
          : "La ventana de confirmación ya cerró."
        : pendientes === 0
          ? "No hay seleccionadas pendientes de confirmar."
          : !pruebaOk
            ? "Manda primero una prueba exitosa para habilitar el envío."
            : null;

  const estadoVentana = abierta
    ? dias <= 0
      ? "cierra hoy"
      : `faltan ${dias} días`
    : antes
      ? "aún no abre"
      : "cerrada";

  return (
    <div className="grid gap-6">
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Fecha límite", value: cierra, note: `${horaCierre} h · ${estadoVentana}` },
          {
            label: "Confirmadas",
            value: `${conteo.confirmada} / ${conteo.todas}`,
            note: conteo.todas ? `${Math.round((conteo.confirmada / conteo.todas) * 100)}% de seleccionadas` : "—",
          },
          { label: "Pendientes", value: String(conteo.pendiente), note: "Sin responder · reciben recordatorio" },
          { label: "Declinaron", value: String(conteo.declinada), note: "Lugar liberado" },
        ].map((k) => (
          <Tarjeta key={k.label} className="p-5">
            <Etiqueta className="text-[9.5px]">{k.label}</Etiqueta>
            <div className="mt-2 font-titulo text-[28px] font-extrabold leading-none">{k.value}</div>
            <div className="mt-1 font-mono text-[10.5px] text-rosa">{k.note}</div>
          </Tarjeta>
        ))}
      </div>

      <Tarjeta>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap" role="tablist" aria-label="Filtrar por estado">
            {(
              [
                ["todas", "Todas"],
                ["confirmada", "Confirmadas"],
                ["pendiente", "Pendientes"],
                ["declinada", "Declinaron"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={filtro === v}
                onClick={() => setFiltro(v)}
                className={`cursor-pointer border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] ${
                  filtro === v
                    ? "border-tinta bg-tinta text-tinta-clara"
                    : "border-linea-fuerte bg-superficie text-gris hover:text-tinta"
                }`}
              >
                {label} · {conteo[v]}
              </button>
            ))}
          </div>
          <a
            href="/admin/confirmaciones/exportar"
            className="border border-linea-fuerte bg-superficie px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-tinta no-underline hover:border-rosa hover:text-rosa hover:no-underline"
          >
            Descargar CSV
          </a>
        </div>

        {visibles.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-gris">No hay aplicantes en este estado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-fondo">
                  {["Folio", "Nombre", "Universidad", "Estado", "Respondió", "Ciudad", "Talla", ""].map((h) => (
                    <th
                      key={h || "detalle"}
                      scope="col"
                      className="border-b border-linea px-4 py-3 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-gris"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => {
                  const expandido = abierto === f.folio;
                  const conDetalle = f.estado === "confirmada";
                  return (
                    <FilaTabla
                      key={f.folio}
                      fila={f}
                      expandido={expandido}
                      conDetalle={conDetalle}
                      alternar={() => setAbierto(expandido ? null : f.folio)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <Tarjeta>
          <Etiqueta className="mb-3">Vista previa del recordatorio</Etiqueta>
          <p className="mb-3 text-[13px]">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gris">Asunto · </span>
            {previa.asunto}
          </p>
          <iframe
            title="Vista previa del correo"
            srcDoc={previa.html}
            sandbox=""
            className="h-[560px] w-full border border-linea bg-white"
          />
          <p className="mt-2 font-mono text-[10px] text-gris">
            Cada aplicante recibe su nombre. El enlace lleva a su pantalla de confirmación.
          </p>
        </Tarjeta>

        <div className="grid gap-6">
          <Tarjeta>
            <Etiqueta className="mb-3 text-rosa">1 · Enviar prueba</Etiqueta>
            <p className="mb-4 text-[13px] leading-relaxed text-gris">
              Manda el recordatorio a una sola dirección, marcado como prueba. No le llega a ninguna
              aplicante.
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
            <Etiqueta className="mb-3 text-rosa">2 · Enviar a pendientes</Etiqueta>
            <p className="mb-4 text-[13px] leading-relaxed text-gris">
              {pendientes} {pendientes === 1 ? "seleccionada no ha" : "seleccionadas no han"} confirmado
              ni declinado. Antes de cada lote se vuelve a revisar: quien ya respondió no recibe el
              correo.
            </p>
            {ultimoEnvio && (
              <p className="mb-4 font-mono text-[10.5px] text-rosa-oscuro">
                Último envío a pendientes: {ultimoEnvio}.
              </p>
            )}

            {confirmando ? (
              <div className="grid gap-2.5 border border-rosa p-3.5">
                <span className="text-[12.5px]">
                  Se enviará el recordatorio a {pendientes}{" "}
                  {pendientes === 1 ? "seleccionada" : "seleccionadas"}. No se puede deshacer.
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Boton type="button" onClick={enviarTodas}>
                    Sí, enviar a {pendientes}
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
                {enviando ? "Enviando…" : `Enviar a ${pendientes}`}
              </Boton>
            )}

            {bloqueo && !enviando && <p className="mt-2 font-mono text-[10.5px] text-gris">{bloqueo}</p>}

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
    </div>
  );
}

function FilaTabla({
  fila: f,
  expandido,
  conDetalle,
  alternar,
}: {
  fila: Fila;
  expandido: boolean;
  conDetalle: boolean;
  alternar: () => void;
}) {
  return (
    <>
      <tr className="border-b border-linea align-top">
        <td className="px-4 py-2.5 font-mono text-[11.5px]">{f.folio}</td>
        <td className="px-4 py-2.5">
          {f.nombre}
          <div className="font-mono text-[11px] text-gris">{f.email}</div>
        </td>
        <td className="px-4 py-2.5 text-gris">{f.universidad}</td>
        <td className="px-4 py-2.5">
          <Chip tono={CHIP[f.estado].tono}>{CHIP[f.estado].texto}</Chip>
        </td>
        <td className="px-4 py-2.5 font-mono text-[11px] text-gris">{f.respondido ?? "—"}</td>
        <td className="px-4 py-2.5 text-gris">{f.ciudad ?? "—"}</td>
        <td className="px-4 py-2.5 font-mono text-[11.5px]">{f.talla ?? "—"}</td>
        <td className="px-4 py-2.5 text-right">
          {conDetalle && (
            <button
              type="button"
              onClick={alternar}
              aria-expanded={expandido}
              className="cursor-pointer border-0 bg-transparent font-mono text-[10.5px] uppercase tracking-[0.08em] text-rosa underline"
            >
              {expandido ? "Ocultar" : "Detalle"}
            </button>
          )}
        </td>
      </tr>
      {expandido && (
        <tr className="border-b border-linea bg-fondo">
          <td colSpan={8} className="px-4 py-3 text-[12.5px]">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-gris">
                  Contacto de emergencia ·{" "}
                </span>
                {f.emergencia ?? "—"}
              </div>
              <div>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-gris">
                  Requerimientos alimentarios ·{" "}
                </span>
                {f.alimentos ?? "Ninguno"}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
