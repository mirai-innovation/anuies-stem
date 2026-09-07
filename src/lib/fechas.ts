import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { ZONA_HORARIA } from "./constantes";

/** Todo lo que se muestra al usuario se formatea en la zona de la convocatoria,
 *  no en la del servidor ni en la del navegador. */
export function fecha(d: Date | null | undefined, patron = "d 'de' MMMM 'de' yyyy") {
  if (!d) return "—";
  return formatInTimeZone(d, ZONA_HORARIA, patron, { locale: es });
}

/** "15 NOV 2026", el formato mono en mayusculas del diseno. */
export function fechaCorta(d: Date | null | undefined) {
  if (!d) return "—";
  return formatInTimeZone(d, ZONA_HORARIA, "d MMM yyyy", { locale: es }).toUpperCase();
}

export function fechaHora(d: Date | null | undefined) {
  if (!d) return "—";
  return formatInTimeZone(d, ZONA_HORARIA, "d MMM yyyy · HH:mm", { locale: es }).toUpperCase();
}

/** Dias completos que faltan para una fecha. Negativo si ya paso. */
export function diasPara(d: Date, desde = new Date()) {
  return Math.ceil((d.getTime() - desde.getTime()) / 86_400_000);
}

/** "hace 2 min", para el indicador de autoguardado. */
export function hace(d: Date | null | undefined, ahora = new Date()) {
  if (!d) return null;
  const min = Math.floor((ahora.getTime() - d.getTime()) / 60_000);
  if (min < 1) return "hace unos segundos";
  if (min === 1) return "hace 1 min";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h === 1) return "hace 1 hora";
  if (h < 24) return `hace ${h} horas`;
  return `el ${fecha(d, "d 'de' MMMM")}`;
}

/** mm:ss, para la duracion de los videos. */
export function duracion(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function pesoArchivo(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
