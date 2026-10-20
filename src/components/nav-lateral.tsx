"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLateral({ enlaces }: { enlaces: { href: string; label: string }[] }) {
  const ruta = usePathname();

  // Se marca un solo enlace: el más específico que contenga la ruta. Así
  // "/admin/aplicaciones/123" marca "Aplicaciones" y no también "/admin".
  const coincide = (href: string) => ruta === href || ruta.startsWith(href + "/");
  const directo = enlaces
    .filter((e) => coincide(e.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  // Si ninguno coincide, se cae a la primera sección de la ruta:
  // "/aplicacion/datos" debe seguir marcado en "/aplicacion/propuesta".
  const marcado =
    directo ??
    enlaces.find((e) => {
      const raiz = "/" + e.href.split("/")[1];
      return raiz !== "/" && coincide(raiz);
    });

  return (
    <nav className="flex flex-col py-3.5" aria-label="Secciones">
      {enlaces.map((e) => {
        const activo = e.href === marcado?.href;

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
