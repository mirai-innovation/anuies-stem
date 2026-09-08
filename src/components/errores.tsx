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

  const primeraClave = pendientes[0]?.[0];

  useEffect(() => {
    if (!primeraClave) return;

    // Se espera al siguiente cuadro para que el foco se aplique cuando React
    // ya terminó de pintar el resultado de la acción. `focus()` desplaza la
    // página hasta el campo por sí solo, así que no se combina con un
    // `scrollIntoView` suave: hacerlo enfrentaba el desplazamiento con el
    // re-render.
    const cuadro = requestAnimationFrame(() => {
      document.getElementById(primeraClave)?.focus();
    });
    return () => cancelAnimationFrame(cuadro);
  }, [errores, primeraClave]);

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
                  document.getElementById(clave)?.focus();
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
