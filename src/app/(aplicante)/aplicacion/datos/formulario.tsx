"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { NIVELES } from "@/lib/constantes";
import { Aviso, Boton, Campo, Entrada, Etiqueta, Seleccion, Tarjeta } from "@/components/ui";
import { ResumenErrores } from "@/components/errores";
import { guardarDatos, type EstadoGuardado } from "../acciones";
import { Autoguardado } from "../autoguardado";
import { ZonaVideo, type FilaVideo } from "../video-zona";

type Inicial = {
  nombreCompleto: string;
  curp: string;
  fechaNacimiento: string;
  telefono: string;
  correoInstitucional: string;
  estadoUniversidad: string;
  universidad: string;
  programaEducativo: string;
  nivel: string;
  semestre: string;
  promedio: string;
  declaraNoUltimoAnio: boolean;
};

const VACIO: EstadoGuardado = {};
/** El brief pide autoguardado cada 30 s. */
const INTERVALO_MS = 30_000;

/** Orden en que se recorren los campos al señalar lo que falta: el mismo en
 *  que aparecen en pantalla. */
const ETIQUETAS: [string, string][] = [
  ["nombreCompleto", "Nombre completo"],
  ["curp", "CURP"],
  ["fechaNacimiento", "Fecha de nacimiento"],
  ["telefono", "Teléfono"],
  ["correoInstitucional", "Correo institucional"],
  ["estadoUniversidad", "Estado de la universidad"],
  ["universidad", "Universidad"],
  ["programaEducativo", "Programa educativo"],
  ["nivel", "Nivel"],
  ["semestre", "Semestre actual"],
  ["promedio", "Promedio global acumulado"],
  ["declaraNoUltimoAnio", "Declaración de no cursar el último año"],
];

export function FormularioDatos({
  inicial,
  universidades,
  estados,
  promedioMinimo,
  guardadaEn,
  videos,
  totalVideos,
}: {
  inicial: Inicial;
  universidades: { nombre: string; estado: string }[];
  estados: string[];
  promedioMinimo: number;
  guardadaEn: string | null;
  videos: FilaVideo[];
  totalVideos: number;
}) {
  const router = useRouter();
  const [estado, accion, enviando] = useActionState(guardarDatos, VACIO);
  const form = useRef<HTMLFormElement>(null);

  const [estadoUni, setEstadoUni] = useState(inicial.estadoUniversidad);
  const [ultimoGuardado, setUltimoGuardado] = useState<string | null>(guardadaEn);
  const [guardandoSolo, setGuardandoSolo] = useState(false);

  const err = estado.errores ?? {};

  // Las sugerencias se acotan al estado elegido: son 145 instituciones en todo
  // el país y sin acotar la lista no ayuda a nadie.
  const sugerencias = useMemo(
    () =>
      (estadoUni ? universidades.filter((u) => u.estado === estadoUni) : universidades).map(
        (u) => u.nombre,
      ),
    [estadoUni, universidades],
  );

  useEffect(() => {
    if (estado.guardadaEn) setUltimoGuardado(estado.guardadaEn);
    if (estado.ok && !estado.errores) {
      const modo = form.current?.querySelector<HTMLInputElement>('input[name="modo"]');
      if (modo?.value === "validar") router.push("/aplicacion/propuesta");
    }
  }, [estado, router]);

  /** Guardado silencioso: manda el formulario tal como está, sin validar y sin
   *  mover el foco ni la página. */
  async function guardarEnSilencio() {
    if (!form.current) return;
    const datos = new FormData(form.current);
    datos.set("modo", "parcial");
    setGuardandoSolo(true);
    const r = await guardarDatos({}, datos);
    setGuardandoSolo(false);
    if (r.guardadaEn) setUltimoGuardado(r.guardadaEn);
  }

  useEffect(() => {
    const t = setInterval(guardarEnSilencio, INTERVALO_MS);
    return () => {
      clearInterval(t);
      void guardarEnSilencio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <form id="form-datos" ref={form} action={accion} noValidate>
        <input type="hidden" name="modo" value="validar" />

        {estado.error && (
          <div className="mb-5">
            <Aviso>{estado.error}</Aviso>
          </div>
        )}
        <ResumenErrores errores={estado.errores} etiquetas={ETIQUETAS} />

        <div className="grid gap-6">
          <Tarjeta>
            <Etiqueta className="mb-5 text-rosa">Identificación</Etiqueta>
            <div className="grid gap-4">
              <Campo id="nombreCompleto" etiqueta="Nombre completo" error={err.nombreCompleto}>
                <Entrada
                  id="nombreCompleto"
                  name="nombreCompleto"
                  defaultValue={inicial.nombreCompleto}
                  placeholder="Nombre y apellidos"
                  aria-invalid={Boolean(err.nombreCompleto)}
                />
              </Campo>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo id="curp" etiqueta="CURP" error={err.curp}>
                  <Entrada
                    id="curp"
                    name="curp"
                    defaultValue={inicial.curp}
                    maxLength={18}
                    placeholder="MADA010203MDFXXX00"
                    className="uppercase"
                    aria-invalid={Boolean(err.curp)}
                  />
                </Campo>
                <Campo
                  id="fechaNacimiento"
                  etiqueta="Fecha de nacimiento"
                  error={err.fechaNacimiento}
                >
                  <Entrada
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    type="date"
                    defaultValue={inicial.fechaNacimiento}
                    aria-invalid={Boolean(err.fechaNacimiento)}
                  />
                </Campo>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo id="telefono" etiqueta="Teléfono" error={err.telefono}>
                  <Entrada
                    id="telefono"
                    name="telefono"
                    type="tel"
                    defaultValue={inicial.telefono}
                    placeholder="+52 55 0000 0000"
                    aria-invalid={Boolean(err.telefono)}
                  />
                </Campo>
                <Campo
                  id="correoInstitucional"
                  etiqueta="Correo institucional"
                  error={err.correoInstitucional}
                >
                  <Entrada
                    id="correoInstitucional"
                    name="correoInstitucional"
                    type="email"
                    defaultValue={inicial.correoInstitucional}
                    placeholder="nombre@universidad.mx"
                    aria-invalid={Boolean(err.correoInstitucional)}
                  />
                </Campo>
              </div>
            </div>
          </Tarjeta>

          <Tarjeta>
            <Etiqueta className="mb-5 text-rosa">Trayectoria académica</Etiqueta>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
                <Campo
                  id="estadoUniversidad"
                  etiqueta="Estado de la universidad"
                  error={err.estadoUniversidad}
                >
                  <Seleccion
                    id="estadoUniversidad"
                    name="estadoUniversidad"
                    value={estadoUni}
                    onChange={(e) => setEstadoUni(e.target.value)}
                    aria-invalid={Boolean(err.estadoUniversidad)}
                  >
                    <option value="">Selecciona…</option>
                    {estados.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </Seleccion>
                </Campo>

                <Campo
                  id="universidad"
                  etiqueta="Universidad"
                  ayuda={
                    estadoUni
                      ? `${sugerencias.length} instituciones ANUIES en ${estadoUni}. Si la tuya no aparece, escríbela.`
                      : "Elige primero el estado para ver las instituciones de tu entidad."
                  }
                  error={err.universidad}
                >
                  <Entrada
                    id="universidad"
                    name="universidad"
                    list="catalogo-universidades"
                    autoComplete="off"
                    defaultValue={inicial.universidad}
                    placeholder="Escribe el nombre de tu institución"
                    aria-invalid={Boolean(err.universidad)}
                  />
                  <datalist id="catalogo-universidades">
                    {sugerencias.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </Campo>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  id="programaEducativo"
                  etiqueta="Programa educativo"
                  error={err.programaEducativo}
                >
                  <Entrada
                    id="programaEducativo"
                    name="programaEducativo"
                    defaultValue={inicial.programaEducativo}
                    placeholder="Ingeniería en Mecatrónica"
                    aria-invalid={Boolean(err.programaEducativo)}
                  />
                </Campo>
                <Campo id="nivel" etiqueta="Nivel" error={err.nivel}>
                  <Seleccion
                    id="nivel"
                    name="nivel"
                    defaultValue={inicial.nivel}
                    aria-invalid={Boolean(err.nivel)}
                  >
                    <option value="">Selecciona…</option>
                    {Object.entries(NIVELES).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Seleccion>
                </Campo>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo id="semestre" etiqueta="Semestre actual" error={err.semestre}>
                  <Entrada
                    id="semestre"
                    name="semestre"
                    type="number"
                    min={1}
                    max={14}
                    defaultValue={inicial.semestre}
                    placeholder="6"
                    aria-invalid={Boolean(err.semestre)}
                  />
                </Campo>
                <Campo
                  id="promedio"
                  etiqueta="Promedio global acumulado"
                  ayuda={`Mínimo requerido: ${promedioMinimo.toFixed(1)}`}
                  error={err.promedio}
                >
                  <Entrada
                    id="promedio"
                    name="promedio"
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    defaultValue={inicial.promedio}
                    placeholder="9.4"
                    aria-invalid={Boolean(err.promedio)}
                  />
                </Campo>
              </div>

              <div className={err.declaraNoUltimoAnio ? "border border-rosa-oscuro p-3" : ""}>
                <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-tinta">
                  <input
                    id="declaraNoUltimoAnio"
                    type="checkbox"
                    name="declaraNoUltimoAnio"
                    value="1"
                    defaultChecked={inicial.declaraNoUltimoAnio}
                    className="mt-0.5 accent-[#D6336C]"
                  />
                  <span>
                    Declaro que <strong>no curso el último año</strong> de mi programa educativo.
                  </span>
                </label>
                {err.declaraNoUltimoAnio && (
                  <p role="alert" className="mt-2 font-mono text-[10px] text-rosa-oscuro">
                    {err.declaraNoUltimoAnio}
                  </p>
                )}
              </div>
            </div>
          </Tarjeta>
        </div>

      </form>

      {/* El video de presentación habla de la aplicante, no del proyecto, así
          que acompaña a sus datos.
          Queda FUERA del <form> a propósito: se sube por su cuenta y no debe
          viajar en el envío del formulario. Para que aun así aparezca antes de
          los botones, la barra de acciones también sale del form y el botón de
          continuar se ata a él con el atributo `form`. */}
      <div className="mt-6 grid gap-6">
        <Etiqueta className="tracking-[0.14em]">Video 1 de {totalVideos} · sobre ti</Etiqueta>
        {videos.map((v) => (
          <ZonaVideo key={v.tipo} fila={v} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <Autoguardado guardadaEn={ultimoGuardado} />
        <div className="flex flex-wrap gap-3">
          <Boton
            type="button"
            variante="secundario"
            disabled={guardandoSolo}
            onClick={guardarEnSilencio}
          >
            {guardandoSolo ? "Guardando…" : "Guardar borrador"}
          </Boton>
          <Boton type="submit" form="form-datos" disabled={enviando}>
            {enviando ? "Guardando…" : "Continuar a propuesta →"}
          </Boton>
        </div>
      </div>
    </>
  );
}
