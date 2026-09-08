"use client";

import { useEffect, useRef, useState } from "react";
import { Aviso, Barra, Boton, Etiqueta } from "@/components/ui";
import { duracion } from "@/lib/fechas";

type Fase = "inactiva" | "pidiendo" | "lista" | "grabando" | "revisando" | "subiendo";

/** Grabación del video de presentación con la cámara del equipo.
 *
 *  No se pide un archivo: se graba en el momento. La grabación se detiene sola
 *  al llegar al límite, así que la aplicante no puede pasarse de tiempo por
 *  descuido.
 *
 *  Requiere HTTPS o localhost; los navegadores no dan acceso a la cámara en
 *  conexiones sin cifrar. */
export function GrabadorCamara({
  titulo,
  maxSegundos,
  subiendo,
  progreso,
  onGrabacion,
}: {
  /** El grabador sirve para los dos videos, así que el encabezado lo pone
   *  quien lo usa: decir "graba tu presentación" sobre el video de propuesta
   *  confundiría justo donde hay que ser claro. */
  titulo: string;
  maxSegundos: number;
  subiendo: boolean;
  progreso: number | null;
  onGrabacion: (archivo: File, segundos: number) => void;
}) {
  const [fase, setFase] = useState<Fase>("inactiva");
  const [error, setError] = useState<string | null>(null);
  const [transcurrido, setTranscurrido] = useState(0);
  const [grabado, setGrabado] = useState<{ url: string; archivo: File; segundos: number } | null>(
    null,
  );

  const stream = useRef<MediaStream | null>(null);
  const grabadora = useRef<MediaRecorder | null>(null);
  const trozos = useRef<Blob[]>([]);
  const preview = useRef<HTMLVideoElement | null>(null);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);
  const inicio = useRef(0);

  function soltarCamara() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (reloj.current) clearInterval(reloj.current);
  }

  // La cámara se libera al salir de la pantalla: dejar el indicador encendido
  // después de navegar sería inquietante y además consume batería.
  useEffect(() => soltarCamara, []);

  async function activar() {
    setError(null);
    setFase("pidiendo");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });
      stream.current = s;
      if (preview.current) {
        preview.current.srcObject = s;
        preview.current.muted = true;
        await preview.current.play().catch(() => {});
      }
      setFase("lista");
    } catch (e) {
      setFase("inactiva");
      const nombre = e instanceof DOMException ? e.name : "";
      setError(
        nombre === "NotAllowedError"
          ? "No diste permiso para usar la cámara. Habilítalo en el candado de la barra de direcciones y vuelve a intentarlo."
          : nombre === "NotFoundError"
            ? "No encontramos una cámara conectada a este equipo."
            : "No se pudo acceder a la cámara. Revisa que ninguna otra aplicación la esté usando.",
      );
    }
  }

  /** Elige el formato según lo que la cámara entregó de verdad.
   *
   *  Pedir un contenedor con pista de audio (`opus`) cuando el micrófono no
   *  produce muestras hace que el muxer de Chrome no cierre ningún bloque: el
   *  archivo sale con la cabecera y nada más. Por eso el códec de audio solo
   *  se pide si el stream trae una pista de audio viva. */
  function mejorFormato(s: MediaStream) {
    const conAudio = s.getAudioTracks().some((t) => t.readyState === "live");
    const candidatos = conAudio
      ? [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
          "video/mp4",
        ]
      : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    return candidatos.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  }

  /** Una grabación real pesa decenas de KB por segundo. Por debajo de este
   *  umbral lo que hay es una cabecera sin contenido, y conviene decirlo en
   *  vez de dejar subir un archivo que no se puede reproducir. */
  const MINIMO_BYTES = 8 * 1024;

  function grabar() {
    if (!stream.current) return;
    setError(null);
    trozos.current = [];

    const mimeType = mejorFormato(stream.current);
    const mr = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
    grabadora.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) trozos.current.push(e.data);
    };

    mr.onerror = () => {
      if (reloj.current) clearInterval(reloj.current);
      setFase("lista");
      setError("La grabación se interrumpió. Vuelve a intentarlo.");
    };

    mr.onstop = () => {
      if (reloj.current) clearInterval(reloj.current);
      const segundos = Math.max(1, Math.round((Date.now() - inicio.current) / 1000));
      const tipo = mimeType.split(";")[0] || "video/webm";
      const extension = tipo.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(trozos.current, { type: tipo });

      // Se comprueba antes de ofrecerla: subir un archivo vacío y descubrirlo
      // al intentar reproducirlo es la peor forma de enterarse.
      if (blob.size < MINIMO_BYTES) {
        if (preview.current) preview.current.srcObject = stream.current;
        setFase("lista");
        setError(
          "La grabación salió vacía. Suele pasar si el navegador perdió el acceso a la cámara o al micrófono a media grabación. Revisa los permisos y vuelve a intentarlo.",
        );
        return;
      }

      const archivo = new File([blob], `presentacion.${extension}`, { type: tipo });
      setGrabado({ url: URL.createObjectURL(blob), archivo, segundos });
      setFase("revisando");
      if (preview.current) preview.current.srcObject = null;
    };

    inicio.current = Date.now();
    setTranscurrido(0);
    // Con un intervalo, los datos se entregan durante la grabación en lugar de
    // solo al detenerla. Si la entrega final falla, lo grabado hasta ese punto
    // ya está a salvo.
    mr.start(1000);
    setFase("grabando");

    reloj.current = setInterval(() => {
      const s = Math.round((Date.now() - inicio.current) / 1000);
      setTranscurrido(s);
      // Se corta sola: el límite no depende de que la aplicante lo vigile.
      if (s >= maxSegundos) mr.state !== "inactive" && mr.stop();
    }, 200);
  }

  function detener() {
    if (grabadora.current?.state !== "inactive") grabadora.current?.stop();
  }

  function repetir() {
    if (grabado) URL.revokeObjectURL(grabado.url);
    setGrabado(null);
    setFase("lista");
    if (preview.current && stream.current) {
      preview.current.srcObject = stream.current;
      preview.current.muted = true;
      void preview.current.play().catch(() => {});
    }
  }

  const restante = Math.max(0, maxSegundos - transcurrido);

  return (
    <div>
      <div className="relative aspect-video w-full bg-tinta">
        {grabado ? (
          <video src={grabado.url} controls className="size-full" />
        ) : (
          <video ref={preview} playsInline muted className="size-full object-cover" />
        )}

        {fase === "inactiva" && (
          <div className="absolute inset-0 grid place-items-center bg-tinta">
            <div className="px-6 text-center">
              <div className="font-titulo text-[22px] font-bold uppercase text-gris-claro">
                {titulo}
              </div>
              <p className="mx-auto mt-2 max-w-[42ch] text-[12.5px] leading-relaxed text-gris-claro">
                Se graba aquí mismo con tu cámara. Se detiene sola a los {maxSegundos} segundos y
                puedes repetirla las veces que quieras.
              </p>
            </div>
          </div>
        )}

        {fase === "grabando" && (
          <div className="absolute left-3 top-3 flex items-center gap-2 bg-tinta/85 px-2.5 py-1.5">
            <span className="size-2.5 animate-pulse bg-rosa-brillante" aria-hidden />
            <span className="font-mono text-[11px] text-tinta-clara">
              {duracion(transcurrido)} · quedan {restante} s
            </span>
          </div>
        )}
      </div>

      {fase === "grabando" && (
        <div className="mt-3">
          <Barra valor={transcurrido / maxSegundos} />
        </div>
      )}

      {error && (
        <div className="mt-3">
          <Aviso>{error}</Aviso>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {fase === "inactiva" && (
          <Boton type="button" onClick={activar}>
            Activar cámara
          </Boton>
        )}
        {fase === "pidiendo" && (
          <Boton type="button" disabled>
            Pidiendo permiso…
          </Boton>
        )}
        {fase === "lista" && (
          <>
            <Boton type="button" onClick={grabar}>
              Empezar a grabar
            </Boton>
            <button
              type="button"
              onClick={() => {
                soltarCamara();
                setFase("inactiva");
              }}
              className="cursor-pointer border-0 bg-transparent font-mono text-[11px] uppercase tracking-[0.08em] text-gris underline"
            >
              Apagar cámara
            </button>
          </>
        )}
        {fase === "grabando" && (
          <Boton type="button" variante="oscuro" onClick={detener}>
            Detener ({restante} s)
          </Boton>
        )}
        {fase === "revisando" && grabado && (
          <>
            <Boton
              type="button"
              disabled={subiendo}
              onClick={() => {
                setFase("subiendo");
                onGrabacion(grabado.archivo, grabado.segundos);
              }}
            >
              {subiendo ? "Subiendo…" : `Usar esta grabación (${duracion(grabado.segundos)})`}
            </Boton>
            <Boton type="button" variante="secundario" disabled={subiendo} onClick={repetir}>
              Repetir
            </Boton>
          </>
        )}
      </div>

      {progreso !== null && (
        <div className="mt-3">
          <Etiqueta className="mb-1.5 text-[10px]">Subiendo · {progreso}%</Etiqueta>
          <Barra valor={progreso / 100} />
        </div>
      )}
    </div>
  );
}
