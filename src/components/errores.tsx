"use client";

import { useEffect } from "react";
import { Aviso } from "@/components/ui";

/** Resumen de campos pendientes.
 *
 *  Un formulario que solo marca en rojo obliga a recorrerlo entero buscando
 *  qué falta, y en pantallas largas el campo con error puede quedar fuera de
 *  vista. Aquí se nombran los campos, se puede saltar a cada uno, y al
 *  aparecer el aviso el foco va al primero que falta. */
export function ResumenErrores({
  errores,
  etiquetas,
}: {
  errores: Record<string, string> | undefined;
  /** Nombre legible de cada campo, en el orden en que aparecen. */
  etiquetas: [string, string][];
}) {
  const pendientes = etiquetas.filter(([clave]) => errores?.[clave]);

  useEffect(() => {
    if (!pendientes.length) return;
    const primero = document.getElementById(pendientes[0][0]);
    primero?.scrollIntoView({ behavior: "smooth", block: "center" });
    // El foco va después del desplazamiento para no pelearse con él.
    const t = setTimeout(() => primero?.focus({ preventScroll: true }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errores]);

  if (!pendientes.length) return null;

  return (
    <div className="mb-5">
      <Aviso>
        <strong>
          {pendientes.length === 1
            ? "Falta un dato para continuar:"
            : `Faltan ${pendientes.length} datos para continuar:`}
        </strong>
        <ul className="m-0 mt-2 grid list-disc gap-1 pl-5">
          {pendientes.map(([clave, etiqueta]) => (
            <li key={clave}>
              <a
                href={`#${clave}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(clave);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => el?.focus({ preventScroll: true }), 350);
                }}
                className="text-rosa-oscuro underline"
              >
                {etiqueta}
              </a>
              : {errores?.[clave]}
            </li>
          ))}
        </ul>
      </Aviso>
    </div>
  );
}
