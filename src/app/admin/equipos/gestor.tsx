"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TECNOLOGIAS } from "@/lib/constantes";
import { Aviso, Boton, Campo, Chip, Entrada, Etiqueta, Seleccion, Tarjeta } from "@/components/ui";
import {
  asignarIntegrante,
  crearEquipo,
  eliminarEquipo,
  sugerirEquipos,
  type EstadoEquipo,
} from "./acciones";

type Integrante = {
  id: string;
  folio: string;
  nombre: string;
  universidad: string;
  tecnologia: string;
};

type Equipo = { id: string; nombre: string; tecnologia: string; integrantes: Integrante[] };

const VACIO: EstadoEquipo = {};

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function GestorEquipos({
  equipos,
  sinEquipo,
}: {
  equipos: Equipo[];
  sinEquipo: Integrante[];
}) {
  const router = useRouter();
  const [estado, accionCrear, creando] = useActionState(crearEquipo, VACIO);
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ tono: "exito" | "error"; texto: string } | null>(null);
  const [abriendoNuevo, setAbriendoNuevo] = useState(false);

  function correr(fn: () => Promise<EstadoEquipo>) {
    iniciar(async () => {
      const r = await fn();
      setMensaje(
        r.error ? { tono: "error", texto: r.error } : { tono: "exito", texto: r.resumen ?? "Listo." },
      );
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[62ch] text-[13px] leading-relaxed text-gris">
          La sugerencia agrupa por tecnología emergente y reparte universidades para que un equipo
          no salga entero de la misma institución. Todo queda editable después.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Boton
            type="button"
            variante="secundario"
            disabled={pendiente || sinEquipo.length === 0}
            onClick={() => correr(sugerirEquipos)}
          >
            {pendiente ? "Armando…" : `Sugerir equipos (${sinEquipo.length} sin asignar)`}
          </Boton>
          <Boton type="button" variante="oscuro" onClick={() => setAbriendoNuevo((v) => !v)}>
            Nuevo equipo +
          </Boton>
        </div>
      </div>

      {mensaje && (
        <div className="mb-5">
          <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso>
        </div>
      )}

      {abriendoNuevo && (
        <Tarjeta className="mb-6">
          <Etiqueta className="mb-4 text-rosa">Nuevo equipo</Etiqueta>
          {estado.error && (
            <div className="mb-4">
              <Aviso>{estado.error}</Aviso>
            </div>
          )}
          <form action={accionCrear} className="flex flex-wrap items-end gap-4">
            <Campo id="nombre" etiqueta="Nombre del equipo" className="min-w-[240px] flex-1">
              <Entrada id="nombre" name="nombre" placeholder="Equipo 1 · Visión aplicada" />
            </Campo>
            <Campo id="tecnologia" etiqueta="Tecnología" className="min-w-[200px]">
              <Seleccion id="tecnologia" name="tecnologia" defaultValue="ia">
                {Object.entries(TECNOLOGIAS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Seleccion>
            </Campo>
            <Boton type="submit" disabled={creando}>
              {creando ? "Creando…" : "Crear equipo"}
            </Boton>
          </form>
        </Tarjeta>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {equipos.map((e) => (
          <Tarjeta key={e.id}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
              <div className="font-titulo text-[22px] font-bold uppercase leading-tight">
                {e.nombre}
              </div>
              <Chip tono="teal">{e.tecnologia}</Chip>
            </div>

            {e.integrantes.length === 0 ? (
              <p className="text-[13px] text-gris">Sin integrantes todavía.</p>
            ) : (
              <div className="grid gap-3">
                {e.integrantes.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="grid size-8 flex-none place-items-center bg-rosa-suave font-mono text-[11px] font-semibold text-rosa-oscuro">
                      {iniciales(m.nombre)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{m.nombre}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-gris">
                        {m.universidad} · {m.folio}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={pendiente}
                      onClick={() => correr(() => asignarIntegrante(m.id, null))}
                      className="cursor-pointer border-0 bg-transparent font-mono text-[10px] uppercase tracking-[0.06em] text-gris underline hover:text-rosa-oscuro"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-linea pt-3.5 font-mono text-[11px] text-gris">
              <span>
                {e.integrantes.length}{" "}
                {e.integrantes.length === 1 ? "integrante" : "integrantes"}
              </span>
              <button
                type="button"
                disabled={pendiente}
                onClick={() => correr(() => eliminarEquipo(e.id))}
                className="cursor-pointer border-0 bg-transparent font-mono text-[11px] uppercase tracking-[0.06em] text-gris underline hover:text-rosa-oscuro"
              >
                Eliminar equipo
              </button>
            </div>
          </Tarjeta>
        ))}
      </div>

      {sinEquipo.length > 0 && (
        <Tarjeta className="mt-6">
          <Etiqueta className="mb-4">Seleccionadas sin equipo</Etiqueta>
          <div className="grid gap-3">
            {sinEquipo.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 border-b border-linea pb-3 last:border-b-0 last:pb-0">
                <span className="grid size-8 flex-none place-items-center bg-linea font-mono text-[11px] font-semibold text-gris">
                  {iniciales(m.nombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{m.nombre}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-gris">
                    {m.universidad} · {m.tecnologia}
                  </div>
                </div>
                {equipos.length > 0 && (
                  <>
                    <label htmlFor={`asignar-${m.id}`} className="sr-only">
                      Asignar {m.nombre} a un equipo
                    </label>
                    <Seleccion
                      id={`asignar-${m.id}`}
                      defaultValue=""
                      disabled={pendiente}
                      className="w-auto! py-2"
                      onChange={(ev) => {
                        if (ev.target.value) correr(() => asignarIntegrante(m.id, ev.target.value));
                      }}
                    >
                      <option value="">Asignar a…</option>
                      {equipos.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre}
                        </option>
                      ))}
                    </Seleccion>
                  </>
                )}
              </div>
            ))}
          </div>
        </Tarjeta>
      )}
    </>
  );
}
