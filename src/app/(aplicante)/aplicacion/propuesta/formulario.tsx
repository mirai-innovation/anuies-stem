"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { AreaTexto, Aviso, Boton, BotonEnlace, Campo, Entrada, Etiqueta, Tarjeta } from "@/components/ui";
import { ResumenErrores } from "@/components/errores";
import { guardarPropuesta, type EstadoGuardado } from "../acciones";
import { Autoguardado } from "../autoguardado";
import { ZonaVideo, type FilaVideo } from "../video-zona";

const VACIO: EstadoGuardado = {};
const MAX_TEXTO = 800;
const INTERVALO_MS = 30_000;

const ETIQUETAS: [string, string][] = [
  ["nombrePropuesta", "Nombre de la propuesta"],
  ["problema", "Problema u oportunidad"],
  ["impacto", "Impacto social esperado"],
];

export function FormularioPropuesta({
  inicial,
  guardadaEn,
  videos,
  totalVideos,
}: {
  inicial: { nombrePropuesta: string; problema: string; impacto: string };
  guardadaEn: string | null;
  videos: FilaVideo[];
  totalVideos: number;
}) {
  const router = useRouter();
  const [estado, accion, enviando] = useActionState(guardarPropuesta, VACIO);
  const form = useRef<HTMLFormElement>(null);

  const [problema, setProblema] = useState(inicial.problema);
  const [impacto, setImpacto] = useState(inicial.impacto);
  const [ultimoGuardado, setUltimoGuardado] = useState<string | null>(guardadaEn);
  const [guardandoSolo, setGuardandoSolo] = useState(false);

  const err = estado.errores ?? {};

  useEffect(() => {
    if (estado.guardadaEn) setUltimoGuardado(estado.guardadaEn);
    if (estado.ok && !estado.errores) {
      const modo = form.current?.querySelector<HTMLInputElement>('input[name="modo"]');
      if (modo?.value === "validar") router.push("/aplicacion/documentos");
    }
  }, [estado, router]);

  async function guardarEnSilencio() {
    if (!form.current) return;
    const datos = new FormData(form.current);
    datos.set("modo", "parcial");
    setGuardandoSolo(true);
    const r = await guardarPropuesta({}, datos);
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
      <form id="form-propuesta" ref={form} action={accion} noValidate>
        <input type="hidden" name="modo" value="validar" />

        {estado.error && (
          <div className="mb-5">
            <Aviso>{estado.error}</Aviso>
          </div>
        )}
        <ResumenErrores errores={estado.errores} etiquetas={ETIQUETAS} />

        <Tarjeta>
          <Etiqueta className="mb-5 text-rosa">Tu propuesta, por escrito</Etiqueta>
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
                placeholder="Qué problema detectaste, a quién afecta y por qué importa"
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
                placeholder="Qué cambia si tu propuesta funciona, y para quién"
                aria-invalid={Boolean(err.impacto)}
              />
              <div className="mt-1 text-right font-mono text-[10px] text-gris">
                {impacto.length} / {MAX_TEXTO}
              </div>
            </Campo>
          </div>
        </Tarjeta>

      </form>

      {/* Igual que en el paso 1: el video vive fuera del <form> pero se muestra
          antes de los botones, y el de continuar se ata al formulario. */}
      <div className="mt-6 grid gap-6">
        <Etiqueta className="tracking-[0.14em]">
          Video {totalVideos} de {totalVideos} · sobre tu propuesta
        </Etiqueta>
        {videos.map((v) => (
          <ZonaVideo key={v.tipo} fila={v} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <Autoguardado guardadaEn={ultimoGuardado} />
        <div className="flex flex-wrap gap-3">
          <BotonEnlace href="/aplicacion/datos" variante="secundario">
            ← Volver a datos
          </BotonEnlace>
          <Boton
            type="button"
            variante="secundario"
            disabled={guardandoSolo}
            onClick={guardarEnSilencio}
          >
            {guardandoSolo ? "Guardando…" : "Guardar borrador"}
          </Boton>
          <Boton type="submit" form="form-propuesta" disabled={enviando}>
            {enviando ? "Guardando…" : "Continuar a documentos →"}
          </Boton>
        </div>
      </div>
    </>
  );
}
