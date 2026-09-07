import { leerRango, metadatos } from "./almacen";

/** Duración de un MP4/MOV leída del propio archivo.
 *
 *  El navegador informa la duración antes de subir, pero esa cifra la manda el
 *  cliente y el límite de 90 segundos es una regla de la convocatoria: si solo
 *  se validara ahí, bastaría con editar la petición para saltárselo. Aquí se
 *  lee el átomo `mvhd` del archivo que quedó en S3.
 *
 *  MP4 y MOV comparten la estructura de átomos (ISO BMFF / QuickTime), así que
 *  el mismo recorrido sirve para los dos. */

type Caja = { tipo: string; inicio: number; tamano: number; encabezado: number };

function leerCaja(buf: Buffer, off: number): Caja | null {
  if (buf.length - off < 8) return null;
  let tamano = buf.readUInt32BE(off);
  const tipo = buf.toString("latin1", off + 4, off + 8);
  let encabezado = 8;

  if (tamano === 1) {
    // Tamaño de 64 bits en los 8 bytes siguientes.
    if (buf.length - off < 16) return null;
    tamano = Number(buf.readBigUInt64BE(off + 8));
    encabezado = 16;
  }
  return { tipo, inicio: off, tamano, encabezado };
}

/** Devuelve la duración exacta en segundos (con decimales), o null si el
 *  archivo no es legible. El decimal importa: redondear dejaría pasar un video
 *  de 90.4 s contra un límite de 90. */
export async function duracionDeVideo(key: string): Promise<number | null> {
  const { tamanoBytes } = await metadatos(key);
  let off = 0;

  // Se recorren las cajas de primer nivel. `moov` suele estar al inicio o al
  // final segun como se grabo, asi que no se puede asumir una posicion.
  for (let i = 0; i < 64 && off < tamanoBytes; i++) {
    const cabecera = await leerRango(key, off, Math.min(off + 15, tamanoBytes - 1));
    const caja = leerCaja(cabecera, 0);
    if (!caja) return null;

    if (caja.tipo === "moov") {
      // `mvhd` es hijo directo de `moov`; con 200 bytes basta para alcanzarlo.
      const fin = Math.min(off + caja.encabezado + 200, tamanoBytes - 1);
      const cuerpo = await leerRango(key, off + caja.encabezado, fin);

      const hijo = leerCaja(cuerpo, 0);
      if (!hijo || hijo.tipo !== "mvhd") return null;

      const version = cuerpo.readUInt8(hijo.encabezado);
      let p = hijo.encabezado + 4; // versión (1) + banderas (3)

      let escala: number;
      let duracion: number;
      if (version === 1) {
        p += 16; // creación y modificación en 64 bits
        escala = cuerpo.readUInt32BE(p);
        duracion = Number(cuerpo.readBigUInt64BE(p + 4));
      } else {
        p += 8; // creación y modificación en 32 bits
        escala = cuerpo.readUInt32BE(p);
        duracion = cuerpo.readUInt32BE(p + 4);
      }

      if (!escala) return null;
      return duracion / escala;
    }

    if (caja.tamano === 0) break; // la caja se extiende hasta el final
    if (caja.tamano < 8) return null;
    off += caja.tamano;
  }

  return null;
}

/** Aplica el límite de la convocatoria.
 *
 *  Se trunca en lugar de redondear, lo que concede una tolerancia de hasta un
 *  segundo: un video grabado "de 90 segundos" suele medir 90.03 por el borde
 *  de cuadro, y rechazarlo por esa fracción sería un castigo por el códec, no
 *  por incumplir la convocatoria. A partir de 91.0 s ya no pasa. */
export function excedeLimite(segundosExactos: number, limite: number) {
  return Math.floor(segundosExactos) > limite;
}
