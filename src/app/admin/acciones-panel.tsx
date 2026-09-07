"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Boton } from "@/components/ui";
import { ejecutarEvaluacionIA, publicarResultados } from "./acciones";

/** Las dos acciones del panel. Publicar resultados es irreversible —hace
 *  visibles los dictámenes y deja firmes las evaluaciones— así que pide una
 *  confirmación explícita en lugar de ejecutarse al primer clic. */
export function AccionesPanel({
  iaPendientes,
  publicados,
  publicadosEn,
  sinEvaluar,
}: {
  iaPendientes: number;
  publicados: boolean;
  publicadosEn: string | null;
  sinEvaluar: number;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ tono: "exito" | "error"; texto: string } | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  function correr(fn: () => Promise<{ ok?: boolean; error?: string; resumen?: string }>) {
    iniciar(async () => {
      const r = await fn();
      setMensaje(
        r.error
          ? { tono: "error", texto: r.error }
          : { tono: "exito", texto: r.resumen ?? "Listo." },
      );
      setConfirmando(false);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3.5">
      {mensaje && <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso>}

      {publicados ? (
        <Aviso tono="info">
          Resultados publicados el {publicadosEn}. Las evaluaciones quedaron firmes.
        </Aviso>
      ) : null}

      <div className="flex flex-wrap gap-2.5">
        <Boton
          type="button"
          variante="oscuro"
          disabled={pendiente || iaPendientes === 0}
          onClick={() => correr(ejecutarEvaluacionIA)}
        >
          {pendiente
            ? "Procesando…"
            : iaPendientes === 0
              ? "Sin evaluaciones IA pendientes"
              : `Ejecutar evaluación IA (${iaPendientes})`}
        </Boton>

        {!publicados &&
          (confirmando ? (
            <div className="flex flex-wrap items-center gap-2.5 border border-rosa px-3.5 py-2">
              <span className="text-[12.5px] text-tinta">
                Las aplicantes verán su dictamen y las evaluaciones quedarán firmes.
              </span>
              <Boton
                type="button"
                disabled={pendiente}
                onClick={() => correr(publicarResultados)}
              >
                {pendiente ? "Publicando…" : "Sí, publicar"}
              </Boton>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="cursor-pointer border-0 bg-transparent font-mono text-[11px] uppercase tracking-[0.08em] text-gris underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <Boton
              type="button"
              variante="secundario"
              disabled={pendiente || sinEvaluar > 0}
              title={
                sinEvaluar > 0
                  ? `Faltan ${sinEvaluar} aplicaciones por evaluar`
                  : "Publicar resultados"
              }
              onClick={() => setConfirmando(true)}
            >
              Publicar resultados
            </Boton>
          ))}
      </div>

      {!publicados && sinEvaluar > 0 && (
        <p className="font-mono text-[10.5px] text-gris">
          Publicar se habilita cuando las {sinEvaluar} aplicaciones restantes tengan evaluación.
        </p>
      )}
    </div>
  );
}
