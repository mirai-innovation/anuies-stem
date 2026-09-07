"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PASOS } from "@/lib/constantes";

/** Navegación entre los cuatro pasos. Se puede saltar libremente: el brief
 *  permite guardar parcial y volver, así que forzar un orden solo estorbaría. */
export function NavPasos() {
  const ruta = usePathname();

  return (
    <nav aria-label="Pasos de la aplicación" className="mb-7 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
      {PASOS.map((p) => {
        const href = `/aplicacion/${p.slug}`;
        const activo = ruta === href;
        return (
          <Link
            key={p.slug}
            href={href}
            aria-current={activo ? "step" : undefined}
            className={`block border p-3.5 no-underline hover:no-underline ${
              activo
                ? "border-rosa bg-superficie"
                : "border-linea bg-fondo hover:border-linea-fuerte"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-3.5 w-[3px] flex-none ${activo ? "bg-rosa" : "bg-transparent"}`} />
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gris">
                {p.num}
              </span>
            </div>
            <div className="mt-1.5 pl-[11px] text-[13px] font-medium leading-tight text-tinta">
              {p.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
