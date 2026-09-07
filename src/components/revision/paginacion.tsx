import Link from "next/link";
import { POR_PAGINA, type FiltrosLista } from "@/lib/lista";

export function Paginacion({
  base,
  filtros,
  pagina,
  paginas,
  total,
}: {
  base: string;
  filtros: FiltrosLista;
  pagina: number;
  paginas: number;
  total: number;
}) {
  const enlace = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filtros, pagina: String(p) })) {
      if (v) q.set(k, String(v));
    }
    return `${base}?${q.toString()}`;
  };

  const desde = total === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(pagina * POR_PAGINA, total);

  // Con muchas páginas se muestra una ventana alrededor de la actual en lugar
  // de una fila interminable de números.
  const inicio = Math.max(1, Math.min(pagina - 1, paginas - 2));
  const numeros = Array.from({ length: Math.min(3, paginas) }, (_, i) => inicio + i).filter(
    (n) => n >= 1 && n <= paginas,
  );

  const estiloBoton =
    "inline-flex items-center border border-linea-fuerte bg-superficie px-3 py-1.5 font-mono text-[11px] no-underline hover:no-underline";

  return (
    <nav
      aria-label="Paginación de aplicaciones"
      className="flex flex-wrap items-center justify-between gap-3 p-4 font-mono text-[11px] text-gris"
    >
      <span>
        {total === 0
          ? "Sin aplicaciones"
          : `Mostrando ${desde} — ${hasta} de ${total} aplicaciones`}
      </span>
      {paginas > 1 && (
        <div className="flex gap-1.5">
          {pagina > 1 && (
            <Link href={enlace(pagina - 1)} className={`${estiloBoton} text-gris`} aria-label="Página anterior">
              ←
            </Link>
          )}
          {numeros.map((n) => (
            <Link
              key={n}
              href={enlace(n)}
              aria-current={n === pagina ? "page" : undefined}
              className={
                n === pagina
                  ? "inline-flex items-center border border-rosa bg-rosa px-3 py-1.5 font-mono text-[11px] text-white no-underline hover:no-underline"
                  : `${estiloBoton} text-tinta`
              }
            >
              {n}
            </Link>
          ))}
          {pagina < paginas && (
            <Link href={enlace(pagina + 1)} className={`${estiloBoton} text-tinta`} aria-label="Página siguiente">
              →
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
