"use client";

import { useEffect, useRef, useState } from "react";
import { hace } from "@/lib/fechas";

/** Indicador "Guardado automático · hace X min".
 *
 *  Se refresca cada 20 s para que el texto no se quede congelado en "hace 0
 *  min" mientras la aplicante escribe. */
export function Autoguardado({ guardadaEn }: { guardadaEn: Date | string | null }) {
  const [, forzar] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => forzar((n) => n + 1), 20_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const cuando = guardadaEn ? hace(new Date(guardadaEn)) : null;

  return (
    <div className="font-mono text-[10.5px] text-gris" aria-live="polite">
      {cuando ? `Guardado automático · ${cuando}` : "Sin guardar todavía"}
    </div>
  );
}
