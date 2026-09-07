"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { TipoVideo } from "@prisma/client";
import { AreaTexto, Aviso, Barra, Boton, BotonEnlace, Chip, Etiqueta, Tarjeta } from "@/components/ui";
import { CAPTURA_VIDEO, MAX_VIDEO_BYTES } from "@/lib/constantes";
import { duracion, pesoArchivo } from "@/lib/fechas";
import { confirmarVideo, guardarResumenVideo } from "../subidas";
import { useSubida } from "../subidor";
import { Autoguardado } from "../autoguardado";
import { GrabadorCamara } from "./grabador";

type Fila = {
  tipo: TipoVideo;
  nombre: string;
  ayuda: string;
  maxSegundos: number;
  obligatorio: boolean;
  subido: {
    nombreOriginal: string;
    tamanoBytes: number;
    duracionSegundos: number;
    resumen: string;
  } | null;
};

function ZonaVideo({ fila }: { fila: Fila }) {
  const router = useRouter();
  const [arrastrando, setArrastrando] = useState(false);
  const conCamara = CAPTURA_VIDEO[fila.tipo] === "camara";

  // La duración de la grabación la mide el navegador y viaja aparte: el WebM
  // que produce MediaRecorder no la lleva en la cabecera.
  const segundosGrabados = useRef<number | null>(null);
  const [regrabando, setRegrabando] = useState(false);

  const { estado, input, manejar, limpiarError } = useSubida(
    conCamara ? "grabacion" : "video",
    (key, nombre) =>
      confirmarVideo(fila.tipo, key, nombre, segundosGrabados.current ?? undefined),
    () => router.refresh(),
  );

  const ocupado = estado.fase === "subiendo" || estado.fase === "verificando";
  const idInput = `video-${fila.tipo}`;

  return (
    <Tarjeta>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[15px] font-semibold">{fila.nombre}</span>
            <Chip tono={fila.obligatorio ? "rosa" : "gris"}>
              {fila.obligatorio ? "Obligatorio" : "Recomendado"}
            </Chip>
            {fila.subido && <Chip tono="teal">Cargado</Chip>}
          </div>
          <p className="mt-1.5 text-[12.5px] text-gris">{fila.ayuda}</p>
        </div>
        {fila.subido && (
          <div className="text-right">
            <Etiqueta>Duración</Etiqueta>
            <div className="font-mono text-[15px] font-semibold text-tinta">
              {duracion(fila.subido.duracionSegundos)}
            </div>
          </div>
        )}
      </div>

      {conCamara && (!fila.subido || regrabando) ? (
        <GrabadorCamara
          maxSegundos={fila.maxSegundos}
          subiendo={ocupado}
          progreso={estado.fase === "subiendo" ? estado.pct : null}
          onGrabacion={(archivo, segundos) => {
            segundosGrabados.current = segundos;
            void manejar(archivo).then(() => setRegrabando(false));
          }}
        />
      ) : fila.subido ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-linea bg-fondo p-4">
          <div className="min-w-0">
            <div className="truncate font-mono text-[12px] text-tinta">
              {fila.subido.nombreOriginal}
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] text-gris">
              {pesoArchivo(fila.subido.tamanoBytes)}
            </div>
          </div>
          <div className="flex flex-none items-center gap-3">
            <Link
              href={`/archivo/mio/video/${fila.tipo}`}
              target="_blank"
              className="font-mono text-[11px] uppercase tracking-[0.06em]"
            >
              Ver video
            </Link>
            {conCamara ? (
              <button
                type="button"
                disabled={ocupado}
                onClick={() => setRegrabando(true)}
                className="inline-flex cursor-pointer items-center border border-linea-fuerte bg-superficie px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] hover:border-rosa hover:text-rosa disabled:opacity-45"
              >
                Volver a grabar
              </button>
            ) : (
              <label
                htmlFor={idInput}
                className={`inline-flex cursor-pointer items-center border border-linea-fuerte bg-superficie px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] hover:border-rosa hover:text-rosa ${
                  ocupado ? "pointer-events-none opacity-45" : ""
                }`}
              >
                Reemplazar
              </label>
            )}
          </div>
        </div>
      ) : (
        <label
          htmlFor={idInput}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            const a = e.dataTransfer.files?.[0];
            if (a && !ocupado) void manejar(a);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-6 py-10 text-center ${
            arrastrando ? "border-rosa bg-rosa-suave" : "border-linea-fuerte bg-fondo"
          } ${ocupado ? "pointer-events-none opacity-45" : ""}`}
        >
          <span className="font-titulo text-[22px] font-bold uppercase text-gris">
            Arrastra tu video aquí
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-gris">
            MP4 · MOV · máx. {pesoArchivo(MAX_VIDEO_BYTES)} · hasta {fila.maxSegundos} s
          </span>
          <span className="mt-2 inline-flex items-center border border-linea-fuerte bg-superficie px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em]">
            Seleccionar archivo
          </span>
        </label>
      )}

      <input
        id={idInput}
        ref={input}
        type="file"
        accept="video/mp4,video/quicktime"
        hidden={conCamara}
        className="sr-only"
        disabled={ocupado}
        onChange={(e) => {
          const a = e.target.files?.[0];
          if (a) void manejar(a);
        }}
      />

      {estado.fase === "subiendo" && (
        <div className="mt-4">
          <div className="mb-1.5 font-mono text-[10.5px] text-gris">
            Subiendo · {estado.nombre} · {estado.pct}%
          </div>
          <Barra valor={estado.pct / 100} />
        </div>
      )}
      {estado.fase === "verificando" && (
        <p className="mt-4 font-mono text-[10.5px] text-gris">
          Verificando duración y formato en el servidor…
        </p>
      )}
      {estado.fase === "error" && (
        <div className="mt-4">
          <Aviso>
            {estado.mensaje}{" "}
            <button onClick={limpiarError} className="underline" type="button">
              Cerrar
            </button>
          </Aviso>
        </div>
      )}

      {fila.tipo === "propuesta" && fila.subido && <ResumenPropuesta inicial={fila.subido.resumen} />}
    </Tarjeta>
  );
}

function ResumenPropuesta({ inicial }: { inicial: string }) {
  const [texto, setTexto] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  return (
    <div className="mt-5 border-t border-linea pt-5">
      <label
        htmlFor="resumenVideo"
        className="mb-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-gris"
      >
        Resumen de la propuesta (opcional)
      </label>
      <AreaTexto
        id="resumenVideo"
        rows={2}
        maxLength={600}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setGuardado(false);
        }}
        placeholder="Dos o tres líneas que acompañen tu video"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] text-gris">
          {guardado ? "Resumen guardado" : `${texto.length} / 600`}
        </span>
        <Boton
          type="button"
          variante="secundario"
          disabled={guardando}
          onClick={async () => {
            setGuardando(true);
            await guardarResumenVideo(texto);
            setGuardando(false);
            setGuardado(true);
          }}
        >
          {guardando ? "Guardando…" : "Guardar resumen"}
        </Boton>
      </div>
    </div>
  );
}

export function ListaVideos({
  videos,
  guardadaEn,
}: {
  videos: Fila[];
  guardadaEn: string | null;
}) {
  const falta = videos.find((v) => v.obligatorio && !v.subido);

  return (
    <>
      <div className="grid gap-6">
        {videos.map((v) => (
          <ZonaVideo key={v.tipo} fila={v} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Autoguardado guardadaEn={guardadaEn} />
          {falta && (
            <span className="font-mono text-[10.5px] text-rosa-oscuro">
              Falta el {falta.nombre.toLowerCase()}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <BotonEnlace href="/aplicacion/datos" variante="secundario">
            ← Volver a datos
          </BotonEnlace>
          <BotonEnlace href="/aplicacion/revision">Revisar y enviar →</BotonEnlace>
        </div>
      </div>
    </>
  );
}
