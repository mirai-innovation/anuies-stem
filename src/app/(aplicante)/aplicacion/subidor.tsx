"use client";

import { useRef, useState } from "react";
import { autorizarSubida, type ClaseArchivo, type ResultadoSubida } from "./subidas";

export type EstadoSubida =
  | { fase: "quieto" }
  | { fase: "subiendo"; pct: number; nombre: string }
  | { fase: "verificando"; nombre: string }
  | { fase: "error"; mensaje: string };

/** Sube el archivo directamente a S3 con el POST firmado.
 *
 *  Se usa XMLHttpRequest y no fetch porque es la única forma de conocer el
 *  progreso de la subida, y con archivos de hasta 500 MB una barra que avanza
 *  es la diferencia entre esperar y creer que se colgó.
 *
 *  El archivo debe ir al final del formulario: S3 evalúa la política con los
 *  campos que ya leyó, así que si el archivo llegara primero, las condiciones
 *  de tipo y tamaño no se aplicarían. */
function subirConProgreso(
  url: string,
  campos: Record<string, string>,
  archivo: File,
  onProgreso: (pct: number) => void,
) {
  return new Promise<void>((resolver, rechazar) => {
    const cuerpo = new FormData();
    for (const [k, v] of Object.entries(campos)) cuerpo.append(k, v);
    cuerpo.append("file", archivo);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgreso(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolver();
      // S3 devuelve 403 con un XML explicando qué condición falló.
      const motivo = /<Message>([^<]+)<\/Message>/.exec(xhr.responseText)?.[1];
      rechazar(
        new Error(
          motivo?.includes("content-length-range")
            ? "El archivo excede el tamaño permitido."
            : (motivo ?? `S3 respondió ${xhr.status}.`),
        ),
      );
    };
    xhr.onerror = () => rechazar(new Error("Se interrumpió la conexión durante la subida."));
    xhr.onabort = () => rechazar(new Error("Subida cancelada."));
    xhr.send(cuerpo);
  });
}

export function useSubida(
  clase: ClaseArchivo,
  confirmar: (key: string, nombre: string) => Promise<ResultadoSubida>,
  alTerminar?: () => void,
) {
  const [estado, setEstado] = useState<EstadoSubida>({ fase: "quieto" });
  const input = useRef<HTMLInputElement>(null);

  async function manejar(archivo: File) {
    setEstado({ fase: "subiendo", pct: 0, nombre: archivo.name });

    const permiso = await autorizarSubida({
      clase,
      nombreArchivo: archivo.name,
      contentType: archivo.type,
      tamanoBytes: archivo.size,
    });

    if (permiso.error || !permiso.url || !permiso.campos || !permiso.key) {
      setEstado({ fase: "error", mensaje: permiso.error ?? "No se pudo autorizar la subida." });
      return;
    }

    try {
      await subirConProgreso(permiso.url, permiso.campos, archivo, (pct) =>
        setEstado({ fase: "subiendo", pct, nombre: archivo.name }),
      );
    } catch (e) {
      setEstado({ fase: "error", mensaje: e instanceof Error ? e.message : "Falló la subida." });
      return;
    }

    // El servidor comprueba el objeto ya subido: tipo, peso y, en video, la
    // duración real del archivo.
    setEstado({ fase: "verificando", nombre: archivo.name });
    const r = await confirmar(permiso.key, archivo.name);

    if (r.error) {
      setEstado({ fase: "error", mensaje: r.error });
      return;
    }

    setEstado({ fase: "quieto" });
    if (input.current) input.current.value = "";
    alTerminar?.();
  }

  return { estado, input, manejar, limpiarError: () => setEstado({ fase: "quieto" }) };
}
