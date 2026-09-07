import type { AiEvaluation } from "@prisma/client";
import { Etiqueta, Tarjeta } from "@/components/ui";
import { fechaHora } from "@/lib/fechas";

/** Panel de evaluación por IA. Solo se monta para administración; el componente
 *  no comprueba permisos por su cuenta porque nunca recibe datos si el rol no
 *  corresponde: la consulta ni siquiera los trae. */
export function PanelIA({ evaluacion }: { evaluacion: AiEvaluation }) {
  return (
    <Tarjeta tono="oscura">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <Etiqueta className="text-teal-brillante">Evaluación por IA</Etiqueta>
        <span className="border border-teal-brillante/40 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-teal-brillante">
          Solo admin
        </span>
      </div>

      {evaluacion.estado === "pending" && (
        <p className="text-[13px] leading-relaxed text-gris-claro">
          Pendiente de generar. Ejecútala por lote desde el panel general.
        </p>
      )}

      {evaluacion.estado === "error" && (
        <div>
          <p className="text-[13px] leading-relaxed text-rosa-brillante">
            La generación falló tras {evaluacion.intentos}{" "}
            {evaluacion.intentos === 1 ? "intento" : "intentos"}.
          </p>
          {evaluacion.ultimoError && (
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-gris-claro">
              {evaluacion.ultimoError}
            </p>
          )}
        </div>
      )}

      {evaluacion.estado === "ok" && (
        <>
          <Etiqueta className="mb-2 text-[9.5px] text-gris-claro">Resumen automático</Etiqueta>
          <p className="mb-5 text-[13px] leading-relaxed text-tinta-clara">{evaluacion.resumen}</p>

          <Etiqueta className="mb-3 text-[9.5px] text-gris-claro">
            Score por criterio con justificación
          </Etiqueta>
          <div className="grid gap-3.5">
            {evaluacion.criterios.map((c) => (
              <div key={c.criterio} className="border-b border-tinta-clara/12 pb-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-medium">{c.criterio}</span>
                  <span className="font-mono text-[14px] font-semibold text-teal-brillante">
                    {c.score.toFixed(1)}
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-gris-claro">
                  {c.justificacion}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-tinta-clara/12 pt-5">
            <Etiqueta className="mb-3 text-[9.5px] text-gris-claro">
              Verificación de requisitos
            </Etiqueta>
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {evaluacion.verificaciones.map((v) => (
                <li key={v.label} className="flex items-center gap-2.5 text-[12.5px]">
                  <span
                    aria-hidden
                    className={`grid size-4 flex-none place-items-center text-[10px] text-tinta ${
                      v.ok ? "bg-teal-brillante" : "bg-rosa-brillante"
                    }`}
                  >
                    {v.ok ? "✓" : "!"}
                  </span>
                  <span>
                    {v.label}
                    <span className="sr-only">{v.ok ? " — cumple" : " — requiere revisión"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-5 font-mono text-[10px] leading-relaxed text-gris-claro">
            Generada {fechaHora(evaluacion.generadaEn)} con {evaluacion.modelo}
            {evaluacion.usoTranscripcion ? " · con transcripción del video" : " · sin transcripción"}.
            Este puntaje es informativo y no sustituye la evaluación del comité.
          </p>
        </>
      )}
    </Tarjeta>
  );
}
