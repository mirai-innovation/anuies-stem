import { db } from "./db";

/** Normaliza para comparar: sin acentos, sin mayúsculas, sin puntuación y con
 *  los espacios colapsados, de modo que "Politecnico" reconozca a
 *  "Politécnico" y "unam" a "UNAM". */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Palabras que no distinguen a una institución de otra. */
const VACIAS = new Set([
  "universidad", "instituto", "tecnologico", "nacional", "autonoma", "autonomo",
  "de", "del", "la", "el", "los", "las", "y", "en", "estado", "mexico",
  "superior", "estudios", "centro", "escuela", "colegio",
]);

function significativas(texto: string) {
  return new Set(normalizar(texto).split(" ").filter((p) => p.length > 2 && !VACIAS.has(p)));
}

/** Intenta reconocer la institución que escribió la aplicante.
 *
 *  No es una validación: si no se reconoce, la postulación sigue su curso y la
 *  aplicación queda marcada para revisión humana. El catálogo ANUIES no cubre
 *  todas las formas en que una institución se nombra a sí misma, así que
 *  tratarlo como un candado rechazaría casos legítimos. */
export async function reconocerUniversidad(texto: string | null | undefined) {
  const escrito = texto?.trim();
  if (!escrito) return null;

  const catalogo = await db.universidad.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, siglas: true },
  });

  const objetivo = normalizar(escrito);

  // 1. Coincidencia exacta con el nombre o con las siglas.
  const exacta = catalogo.find(
    (u) => normalizar(u.nombre) === objetivo || normalizar(u.siglas) === objetivo,
  );
  if (exacta) return exacta.id;

  // 2. Las siglas aparecen como palabra suelta: "UNAM campus Morelia".
  const palabras = new Set(objetivo.split(" "));
  const porSiglas = catalogo.find((u) => palabras.has(normalizar(u.siglas)));
  if (porSiglas) return porSiglas.id;

  // 3. Todas las palabras distintivas del catálogo están en lo que escribió.
  //    "la Benemérita Universidad Autónoma de Puebla" reconoce a la BUAP, pero
  //    "Universidad de Puebla" no basta para dar por hecho que es esa.
  for (const u of catalogo) {
    const clave = significativas(u.nombre);
    if (clave.size === 0) continue;
    if ([...clave].every((p) => palabras.has(p))) return u.id;
  }

  return null;
}
