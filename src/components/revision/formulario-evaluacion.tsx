"use client";

import { useActionState, useState } from "react";
import type { Dictamen } from "@prisma/client";
import { AreaTexto, Aviso, Boton, Etiqueta, Tarjeta } from "@/components/ui";
import { DICTAMENES } from "@/lib/constantes";
import { guardarEvaluacion, type EstadoEvaluacion } from "@/app/admin/acciones";

const VACIO: EstadoEvaluacion = {};

type Criterio = { clave: string; nombre: string };

export function FormularioEvaluacion({
  applicationId,
  criterios,
  inicial,
}: {
  applicationId: string;
  criterios: Criterio[];
  inicial: {
    criterios: Record<string, number>;
    fortalezas: string;
    areasOportunidad: string;
    dictamen: Dictamen;
  } | null;
}) {
  const [estado, accion, enviando] = useActionState(guardarEvaluacion, VACIO);
  const [puntajes, setPuntajes] = useState<Record<string, number>>(
    inicial ? { ...inicial.criterios } : {},
  );
  const [dictamen, setDictamen] = useState<Dictamen | "">(inicial?.dictamen ?? "");
  const err = estado.errores ?? {};

  const tonoDictamen: Record<Dictamen, string> = {
    selected: "border-teal text-teal-oscuro bg-teal-suave",
    waitlist: "border-rosa text-rosa-oscuro bg-rosa-suave",
    rejected: "border-gris text-gris bg-fondo",
  };

  return (
    <Tarjeta tono="acento">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5">
        <Etiqueta className="text-rosa">Mi evaluación · escala 1 a 5</Etiqueta>
        {inicial && <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-gris">Ya registrada</span>}
      </div>

      {estado.error && (
        <div className="mb-4">
          <Aviso>{estado.error}</Aviso>
        </div>
      )}
      {estado.ok && (
        <div className="mb-4">
          <Aviso tono="exito">Tu evaluación quedó guardada.</Aviso>
        </div>
      )}

      <form action={accion} className="grid gap-5">
        <input type="hidden" name="applicationId" value={applicationId} />

        {criterios.map((c) => (
          <fieldset key={c.clave} className="m-0 border-0 p-0">
            <legend className="mb-2.5 p-0 text-[13.5px] font-medium">{c.nombre}</legend>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => {
                const activo = puntajes[c.clave] === v;
                return (
                  <label
                    key={v}
                    className={`flex-1 cursor-pointer border py-2.5 text-center font-mono text-[13px] ${
                      activo
                        ? "border-rosa bg-rosa-suave text-rosa-oscuro"
                        : "border-linea-fuerte bg-superficie text-tinta hover:border-rosa"
                    }`}
                  >
                    <input
                      type="radio"
                      name={c.clave}
                      value={v}
                      checked={activo}
                      onChange={() => setPuntajes((p) => ({ ...p, [c.clave]: v }))}
                      className="sr-only"
                    />
                    <span aria-hidden>{v}</span>
                    <span className="sr-only">
                      {v} de 5 en {c.nombre}
                    </span>
                  </label>
                );
              })}
            </div>
            {err[c.clave] && (
              <p role="alert" className="mt-1.5 font-mono text-[10px] text-rosa-oscuro">
                {err[c.clave]}
              </p>
            )}
          </fieldset>
        ))}

        <div>
          <label
            htmlFor="fortalezas"
            className="mb-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-gris"
          >
            Fortalezas para la aplicante
          </label>
          <AreaTexto
            id="fortalezas"
            name="fortalezas"
            rows={3}
            defaultValue={inicial?.fortalezas ?? ""}
            placeholder="Lo que el comité reconoce en la propuesta. Este texto se publica con el resultado."
            aria-invalid={Boolean(err.fortalezas)}
          />
          {err.fortalezas && (
            <p role="alert" className="mt-1.5 font-mono text-[10px] text-rosa-oscuro">
              {err.fortalezas}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="areasOportunidad"
            className="mb-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-gris"
          >
            Áreas de oportunidad
          </label>
          <AreaTexto
            id="areasOportunidad"
            name="areasOportunidad"
            rows={3}
            defaultValue={inicial?.areasOportunidad ?? ""}
            placeholder="Qué debe trabajar antes del Demo Day. También se publica."
            aria-invalid={Boolean(err.areasOportunidad)}
          />
          {err.areasOportunidad && (
            <p role="alert" className="mt-1.5 font-mono text-[10px] text-rosa-oscuro">
              {err.areasOportunidad}
            </p>
          )}
        </div>

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 p-0 font-mono text-[10px] uppercase tracking-[0.12em] text-gris">
            Dictamen
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {(Object.keys(DICTAMENES) as Dictamen[]).map((d) => {
              const activo = dictamen === d;
              return (
                <label
                  key={d}
                  className={`min-w-[120px] flex-1 cursor-pointer border p-2.5 text-center font-mono text-[11px] uppercase tracking-[0.08em] ${
                    activo ? tonoDictamen[d] : "border-linea-fuerte bg-superficie text-tinta hover:border-rosa"
                  }`}
                >
                  <input
                    type="radio"
                    name="dictamen"
                    value={d}
                    checked={activo}
                    onChange={() => setDictamen(d)}
                    className="sr-only"
                  />
                  {DICTAMENES[d]}
                </label>
              );
            })}
          </div>
          {err.dictamen && (
            <p role="alert" className="mt-1.5 font-mono text-[10px] text-rosa-oscuro">
              Selecciona un dictamen.
            </p>
          )}
        </fieldset>

        <Boton type="submit" disabled={enviando} className="w-full py-3.5">
          {enviando ? "Guardando…" : "Guardar evaluación →"}
        </Boton>
      </form>
    </Tarjeta>
  );
}
