"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { AREAS_STEM, ESTADOS_MEXICO, NIVELES } from "@/lib/constantes";
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  Entrada,
  Etiqueta,
  Seleccion,
  Tarjeta,
} from "@/components/ui";
import { guardarDatos, type EstadoGuardado } from "../acciones";
import { Autoguardado } from "../autoguardado";

type Inicial = {
  nombreCompleto: string;
  curp: string;
  fechaNacimiento: string;
  telefono: string;
  estadoResidencia: string;
  correoInstitucional: string;
  universidad: string;
  programaEducativo: string;
  nivel: string;
  semestre: string;
  promedio: string;
  areaStem: string;
  declaraNoUltimoAnio: boolean;
  nombrePropuesta: string;
  problema: string;
  impacto: string;
};

const VACIO: EstadoGuardado = {};
const MAX_TEXTO = 800;
/** El brief pide autoguardado cada 30 s. */
const INTERVALO_MS = 30_000;

export function FormularioDatos({
  inicial,
  sugerencias,
  promedioMinimo,
  guardadaEn,
}: {
  inicial: Inicial;
  /** Nombres del catálogo ANUIES. Son sugerencias, no opciones: el campo
   *  admite cualquier texto. Sirven para que la misma institución no acabe
   *  escrita de quince formas distintas. */
  sugerencias: string[];
  promedioMinimo: number;
  guardadaEn: string | null;
}) {
  const router = useRouter();
  const [estado, accion, enviando] = useActionState(guardarDatos, VACIO);
  const form = useRef<HTMLFormElement>(null);

  const [problema, setProblema] = useState(inicial.problema);
  const [impacto, setImpacto] = useState(inicial.impacto);
  const [ultimoGuardado, setUltimoGuardado] = useState<string | null>(guardadaEn);
  const [guardandoSolo, setGuardandoSolo] = useState(false);

  const err = estado.errores ?? {};

  useEffect(() => {
    if (estado.guardadaEn) setUltimoGuardado(estado.guardadaEn);
    // Continuar solo avanza cuando el servidor acepto los datos.
    if (estado.ok && !estado.errores) {
      const modo = form.current?.querySelector<HTMLInputElement>('input[name="modo"]');
      if (modo?.value === "validar") router.push("/aplicacion/videos");
    }
  }, [estado, router]);

  /** Guardado silencioso: manda el formulario tal como esta, sin validar y sin
   *  mover el foco ni la pagina. */
  async function guardarEnSilencio() {
    if (!form.current) return;
    const datos = new FormData(form.current);
    datos.set("modo", "parcial");
    setGuardandoSolo(true);
    const r = await guardarDatos({}, datos);
    setGuardandoSolo(false);
    if (r.guardadaEn) setUltimoGuardado(r.guardadaEn);
  }

  // Cada 30 s y al abandonar el paso.
  useEffect(() => {
    const t = setInterval(guardarEnSilencio, INTERVALO_MS);
    return () => {
      clearInterval(t);
      void guardarEnSilencio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form ref={form} action={accion} noValidate>
      <input type="hidden" name="modo" value="validar" />

      {estado.error && (
        <div className="mb-5">
          <Aviso>{estado.error}</Aviso>
        </div>
      )}
      {estado.errores && (
        <div className="mb-5">
          <Aviso>
            Revisa los campos marcados: hay {Object.keys(estado.errores).length}{" "}
            {Object.keys(estado.errores).length === 1 ? "dato pendiente" : "datos pendientes"}.
          </Aviso>
        </div>
      )}

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
              <Campo id="fechaNacimiento" etiqueta="Fecha de nacimiento" error={err.fechaNacimiento}>
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
                id="estadoResidencia"
                etiqueta="Estado de residencia"
                error={err.estadoResidencia}
              >
                <Seleccion
                  id="estadoResidencia"
                  name="estadoResidencia"
                  defaultValue={inicial.estadoResidencia}
                  aria-invalid={Boolean(err.estadoResidencia)}
                >
                  <option value="">Selecciona…</option>
                  {ESTADOS_MEXICO.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </Seleccion>
              </Campo>
            </div>

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
        </Tarjeta>

        <Tarjeta>
          <Etiqueta className="mb-5 text-rosa">Trayectoria académica</Etiqueta>
          <div className="grid gap-4">
            <Campo
              id="universidad"
              etiqueta="Universidad"
              ayuda="Escribe el nombre completo de tu institución"
              error={err.universidad}
            >
              <Entrada
                id="universidad"
                name="universidad"
                list="catalogo-universidades"
                autoComplete="off"
                defaultValue={inicial.universidad}
                placeholder="Universidad Nacional Autónoma de México"
                aria-invalid={Boolean(err.universidad)}
              />
              <datalist id="catalogo-universidades">
                {sugerencias.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </Campo>

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

            <div className="grid gap-4 sm:grid-cols-3">
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
              <Campo id="areaStem" etiqueta="Área STEM" error={err.areaStem}>
                <Seleccion
                  id="areaStem"
                  name="areaStem"
                  defaultValue={inicial.areaStem}
                  aria-invalid={Boolean(err.areaStem)}
                >
                  <option value="">Selecciona…</option>
                  {Object.entries(AREAS_STEM).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Seleccion>
              </Campo>
            </div>

            <div className={err.declaraNoUltimoAnio ? "border border-rosa-oscuro p-3" : ""}>
              <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-tinta">
                <input
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

        <Tarjeta>
          <Etiqueta className="mb-5 text-rosa">Propuesta</Etiqueta>
          <div className="grid gap-4">
            <Campo
              id="nombrePropuesta"
              etiqueta="Nombre de la propuesta"
              error={err.nombrePropuesta}
            >
              <Entrada
                id="nombrePropuesta"
                name="nombrePropuesta"
                defaultValue={inicial.nombrePropuesta}
                placeholder="Ej. Sensa · monitoreo agrícola con IA"
                aria-invalid={Boolean(err.nombrePropuesta)}
              />
            </Campo>

            <Campo
              id="problema"
              etiqueta="Problema u oportunidad que resuelve"
              error={err.problema}
            >
              <AreaTexto
                id="problema"
                name="problema"
                rows={4}
                maxLength={MAX_TEXTO}
                value={problema}
                onChange={(e) => setProblema(e.target.value)}
                placeholder="Máximo 800 caracteres"
                aria-invalid={Boolean(err.problema)}
              />
              <div className="mt-1 text-right font-mono text-[10px] text-gris">
                {problema.length} / {MAX_TEXTO}
              </div>
            </Campo>

            <Campo id="impacto" etiqueta="Impacto social esperado" error={err.impacto}>
              <AreaTexto
                id="impacto"
                name="impacto"
                rows={4}
                maxLength={MAX_TEXTO}
                value={impacto}
                onChange={(e) => setImpacto(e.target.value)}
                placeholder="Máximo 800 caracteres"
                aria-invalid={Boolean(err.impacto)}
              />
              <div className="mt-1 text-right font-mono text-[10px] text-gris">
                {impacto.length} / {MAX_TEXTO}
              </div>
            </Campo>
          </div>
        </Tarjeta>
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
          <Boton type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Continuar a videos →"}
          </Boton>
        </div>
      </div>
    </form>
  );
}
