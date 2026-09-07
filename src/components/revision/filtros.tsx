"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ESTADOS, TECNOLOGIAS } from "@/lib/constantes";
import type { FiltrosLista } from "@/lib/lista";
import { Entrada, Seleccion } from "@/components/ui";

/** Los filtros viven en la URL, no en estado local: así una búsqueda se puede
 *  compartir, guardar en favoritos y sobrevive a recargar la página. */
export function Filtros({
  base,
  filtros,
  universidades,
}: {
  base: string;
  filtros: FiltrosLista;
  universidades: { id: string; siglas: string; nombre: string }[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(filtros.q ?? "");

  function navegar(cambios: Partial<FiltrosLista>) {
    const p = new URLSearchParams();
    const nuevo = { ...filtros, ...cambios, pagina: undefined };
    for (const [k, v] of Object.entries(nuevo)) if (v) p.set(k, String(v));
    router.push(`${base}?${p.toString()}`);
  }

  // La búsqueda espera a que dejes de escribir para no lanzar una consulta
  // por cada tecla.
  useEffect(() => {
    if ((filtros.q ?? "") === q) return;
    const t = setTimeout(() => navegar({ q }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-linea p-4">
      <label htmlFor="buscar" className="sr-only">
        Buscar por nombre, folio o universidad
      </label>
      <Entrada
        id="buscar"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre, folio o universidad…"
        className="min-w-[200px] flex-1 py-2.5"
      />

      <label htmlFor="f-estado" className="sr-only">
        Filtrar por estado
      </label>
      <Seleccion
        id="f-estado"
        value={filtros.estado ?? "todos"}
        onChange={(e) => navegar({ estado: e.target.value })}
        className="w-auto! py-2.5"
      >
        <option value="todos">Todos los estados</option>
        {(["submitted", "in_review", "evaluated", "selected", "waitlist", "rejected"] as const).map(
          (e) => (
            <option key={e} value={e}>
              {ESTADOS[e]}
            </option>
          ),
        )}
      </Seleccion>

      <label htmlFor="f-uni" className="sr-only">
        Filtrar por universidad
      </label>
      <Seleccion
        id="f-uni"
        value={filtros.universidad ?? "todas"}
        onChange={(e) => navegar({ universidad: e.target.value })}
        className="w-auto! py-2.5"
      >
        <option value="todas">Todas las universidades</option>
        {universidades.map((u) => (
          <option key={u.id} value={u.id}>
            {u.siglas}
          </option>
        ))}
      </Seleccion>

      <label htmlFor="f-tec" className="sr-only">
        Filtrar por tecnología
      </label>
      <Seleccion
        id="f-tec"
        value={filtros.tecnologia ?? "todas"}
        onChange={(e) => navegar({ tecnologia: e.target.value })}
        className="w-auto! py-2.5"
      >
        <option value="todas">Toda tecnología</option>
        {Object.entries(TECNOLOGIAS).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Seleccion>
    </div>
  );
}
