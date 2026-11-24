"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ESTADOS, TECNOLOGIAS } from "@/lib/constantes";
import type { FiltrosLista } from "@/lib/lista";
import { Entrada, Seleccion } from "@/components/ui";

/** Los filtros viven en la URL, no en estado local: así una búsqueda se puede
 *  compartir, guardar en favoritos y sobrevive a recargar la página. */
export function Filtros({
  base,
  filtros,
  universidades,
  incluirBorradores = false,
}: {
  base: string;
  filtros: FiltrosLista;
  universidades: { id: string; siglas: string; nombre: string; estado: string }[];
  /** Administración puede filtrar por borradores; el comité no los ve. */
  incluirBorradores?: boolean;
}) {
  const router = useRouter();

  // Se agrupan por entidad y se ordenan dentro de cada una por nombre.
  const porEstado = useMemo(() => {
    const mapa = new Map<string, typeof universidades>();
    for (const u of universidades) {
      const lista = mapa.get(u.estado) ?? [];
      lista.push(u);
      mapa.set(u.estado, lista);
    }
    return [...mapa.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "es"))
      .map(
        ([estado, lista]) =>
          [estado, [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))] as const,
      );
  }, [universidades]);
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
        {(
          [
            // El borrador solo se ofrece a quien puede verlos.
            ...(incluirBorradores ? (["draft"] as const) : []),
            "submitted",
            "in_review",
            "evaluated",
            "selected",
            "waitlist",
            "rejected",
          ] as const
        ).map((e) => (
          <option key={e} value={e}>
            {ESTADOS[e]}
          </option>
        ))}
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
        {/* Agrupadas por entidad: son 145 y en una lista plana no hay forma de
            encontrar una. El nombre completo acompaña a las siglas porque
            "UTCH Sur" o "EN 3 Toluca" no le dicen nada a quien revisa. */}
        {porEstado.map(([estado, lista]) => (
          <optgroup key={estado} label={estado}>
            {lista.map((u) => (
              <option key={u.id} value={u.id}>
                {u.siglas} — {u.nombre}
              </option>
            ))}
          </optgroup>
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
