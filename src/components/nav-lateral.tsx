"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLateral({ enlaces }: { enlaces: { href: string; label: string }[] }) {
  const ruta = usePathname();

  return (
    <nav className="flex flex-col py-3.5" aria-label="Secciones">
      {enlaces.map((e) => {
        // "/aplicacion/datos" debe seguir marcado en "/aplicacion/videos".
        const raiz = "/" + e.href.split("/")[1];
        const activo = ruta === e.href || (raiz !== "/" && ruta.startsWith(raiz));

        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className="flex items-center gap-2.5 px-5 py-2.5 text-[13.5px] text-tinta no-underline hover:bg-fondo hover:no-underline"
          >
            <span className={`h-4 w-[3px] flex-none ${activo ? "bg-rosa" : "bg-transparent"}`} />
            <span>{e.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
