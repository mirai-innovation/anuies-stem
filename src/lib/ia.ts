import OpenAI from "openai";
import type { Application, Universidad } from "@prisma/client";
import { db } from "./db";
import { AREAS_STEM, CRITERIOS, NIVELES, TECNOLOGIAS, VIDEOS } from "./constantes";

/** Evaluación por IA de una aplicación.
 *
 *  Reparto deliberado del trabajo: el modelo solo emite juicio (resumen y
 *  puntaje por criterio con su justificación). Las verificaciones de
 *  requisitos las calcula el código, porque son hechos comprobables contra la
 *  base y pedirle a un modelo que los "verifique" produciría afirmaciones
 *  seguras sobre cosas que no puede consultar. La única que no se puede
 *  automatizar —comparar el promedio declarado contra el PDF de la relación de
 *  estudios— se marca como pendiente de revisión humana en lugar de darla por
 *  buena. */

const MODELO = process.env.OPENAI_MODELO ?? "gpt-4o-mini";
const MAX_INTENTOS = 3;

function cliente() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export function iaConfigurada() {
  return Boolean(process.env.OPENAI_API_KEY);
}

const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["resumen", "criterios", "scoreGlobal"],
  properties: {
    resumen: {
      type: "string",
      description: "Resumen de la propuesta en dos o tres líneas, en español de México.",
    },
    criterios: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterio", "score", "justificacion"],
        properties: {
          criterio: { type: "string", enum: CRITERIOS.map((c) => c.nombre) },
          score: { type: "number", minimum: 1, maximum: 5 },
          justificacion: {
            type: "string",
            description: "Una o dos frases que sostengan el puntaje.",
          },
        },
      },
    },
    scoreGlobal: { type: "number", minimum: 1, maximum: 5 },
  },
} as const;

const SISTEMA = `Eres parte del comité técnico del Reto ANUIES4MX 2026 "Mujeres en STEM: Negocios del Futuro con Tecnologías Emergentes", un programa intensivo de cinco días en México que cierra con un Demo Day.

Evalúas propuestas de negocio de estudiantes mexicanas de educación superior. Calificas exactamente estos cinco criterios, en este orden, en escala de 1 a 5 con un decimal:
${CRITERIOS.map((c, i) => `${i + 1}. ${c.nombre} — ${c.descripcion}`).join("\n")}

Reglas:
- Escribe en español de México, en tono profesional y directo.
- Justifica cada puntaje con evidencia del texto que recibes, no con generalidades.
- Si un dato no está en la información recibida, dilo explícitamente en la justificación en lugar de suponerlo.
- El criterio "Presentación del video" solo puede juzgarse con la transcripción. Si no la recibes, asigna 3 y declara en la justificación que no había transcripción disponible.
- El scoreGlobal es el promedio de los cinco puntajes, con un decimal.
- Tu evaluación es un insumo informativo: nunca sustituye al comité humano.`;

function prompt(app: Application, universidad: Universidad | null, transcripcion: string | null) {
  const video = app.videos.find((v) => v.tipo === "propuesta");

  return `APLICACIÓN ${app.folio}

DATOS ACADÉMICOS
- Universidad: ${universidad?.nombre ?? "no declarada"}
- Programa: ${app.academicos?.programaEducativo ?? "no declarado"}
- Nivel: ${app.academicos?.nivel ? NIVELES[app.academicos.nivel] : "no declarado"}
- Semestre: ${app.academicos?.semestre ?? "no declarado"}
- Promedio global acumulado: ${app.academicos?.promedio ?? "no declarado"}
- Área STEM: ${app.academicos?.areaStem ? AREAS_STEM[app.academicos.areaStem] : "no declarada"}

PROPUESTA
- Nombre: ${app.propuesta?.nombre ?? "sin nombre"}
- Tecnología emergente principal: ${app.propuesta?.tecnologia ? TECNOLOGIAS[app.propuesta.tecnologia] : "no declarada"}

PROBLEMA U OPORTUNIDAD
${app.propuesta?.problema ?? "(sin capturar)"}

IMPACTO SOCIAL ESPERADO
${app.propuesta?.impacto ?? "(sin capturar)"}

VIDEO DE PROPUESTA
- Duración: ${video ? `${video.duracionSegundos} segundos` : "no entregado"}
- Resumen escrito por la aplicante: ${video?.resumen ?? "(no proporcionó)"}
- Transcripción: ${transcripcion ?? "(no disponible)"}`;
}

/** Comprobaciones deterministas contra la base.
 *
 *  No incluyen los documentos: el expediente se integra después de la
 *  publicación de resultados y solo lo entregan las seleccionadas, así que en
 *  el momento de evaluar no hay nada que revisar ahí. */
function verificaciones(app: Application, universidad: Universidad | null, promedioMinimo: number) {
  const video = app.videos.find((v) => v.tipo === "propuesta");
  const limite = VIDEOS.find((v) => v.tipo === "propuesta")!.maxSegundos;

  return [
    {
      label: `Promedio declarado (${app.academicos?.promedio?.toFixed(1) ?? "—"}) alcanza el mínimo de ${promedioMinimo.toFixed(1)}`,
      ok: (app.academicos?.promedio ?? 0) >= promedioMinimo,
    },
    {
      // El catálogo dejó de ser un candado en la captura, así que aquí sirve
      // para señalar a quién hay que verificar a mano.
      label: universidad
        ? `Institución reconocida en el catálogo ANUIES: ${universidad.siglas}`
        : `"${app.academicos?.universidad ?? "sin capturar"}" no coincide con el catálogo ANUIES: verificar contra la constancia`,
      ok: Boolean(universidad?.activa),
    },
    {
      label: "Declara no cursar el último año del programa",
      ok: Boolean(app.academicos?.declaraNoUltimoAnio),
    },
    {
      label: `Video de propuesta dentro de ${limite} s`,
      ok: Boolean(video && video.duracionSegundos <= limite),
    },
    {
      // No se puede automatizar: exige leer el PDF y compararlo con lo
      // capturado. Se deja marcada para que alguien la revise, en lugar de
      // afirmar que coincide.
      label: "Contrastar el promedio contra la relación de estudios (revisión manual)",
      ok: false,
    },
  ];
}

export type ResultadoIA = { ok: boolean; error?: string };

export async function evaluarConIA(applicationId: string): Promise<ResultadoIA> {
  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: { universidad: true },
  });
  if (!app || app.estado === "draft") return { ok: false, error: "Aplicación no disponible." };

  const edicion = await db.edicion.findFirst();
  const promedioMinimo = edicion?.promedioMinimo ?? 9;

  const openai = cliente();
  if (!openai) {
    await marcarError(applicationId, "Falta OPENAI_API_KEY en el servidor.");
    return { ok: false, error: "La evaluación por IA no está configurada." };
  }

  const usarTranscripcion = process.env.TRANSCRIPCION_ACTIVA === "1";
  const transcripcion = usarTranscripcion
    ? (app.videos.find((v) => v.tipo === "propuesta")?.transcripcion ?? null)
    : null;

  let ultimoError = "";

  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    try {
      const r = await openai.chat.completions.create({
        model: MODELO,
        temperature: 0.2,
        messages: [
          { role: "system", content: SISTEMA },
          { role: "user", content: prompt(app, app.universidad, transcripcion) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "evaluacion", schema: ESQUEMA, strict: true },
        },
      });

      const crudo = r.choices[0]?.message?.content;
      if (!crudo) throw new Error("El modelo no devolvió contenido.");

      const datos = JSON.parse(crudo) as {
        resumen: string;
        criterios: { criterio: string; score: number; justificacion: string }[];
        scoreGlobal: number;
      };

      // Se reordenan según el orden fijo del brief; el modelo podría
      // devolverlos en otra secuencia.
      const ordenados = CRITERIOS.map((c) => {
        const encontrado = datos.criterios.find((x) => x.criterio === c.nombre);
        return {
          criterio: c.nombre,
          score: Math.min(5, Math.max(1, encontrado?.score ?? 3)),
          justificacion: encontrado?.justificacion ?? "Sin justificación del modelo.",
        };
      });

      await db.aiEvaluation.upsert({
        where: { applicationId },
        create: {
          applicationId,
          estado: "ok",
          resumen: datos.resumen,
          criterios: ordenados,
          scoreGlobal: Number(
            (ordenados.reduce((a, c) => a + c.score, 0) / ordenados.length).toFixed(1),
          ),
          verificaciones: verificaciones(app, app.universidad, promedioMinimo),
          modelo: MODELO,
          usoTranscripcion: Boolean(transcripcion),
          intentos: intento,
          ultimoError: null,
          generadaEn: new Date(),
        },
        update: {
          estado: "ok",
          resumen: datos.resumen,
          criterios: ordenados,
          scoreGlobal: Number(
            (ordenados.reduce((a, c) => a + c.score, 0) / ordenados.length).toFixed(1),
          ),
          verificaciones: verificaciones(app, app.universidad, promedioMinimo),
          modelo: MODELO,
          usoTranscripcion: Boolean(transcripcion),
          intentos: intento,
          ultimoError: null,
          generadaEn: new Date(),
        },
      });

      return { ok: true };
    } catch (e) {
      ultimoError = e instanceof Error ? e.message : String(e);
      // Espera creciente entre intentos para no insistir contra un límite de
      // frecuencia de la API.
      if (intento < MAX_INTENTOS) {
        await new Promise((r) => setTimeout(r, 800 * intento));
      }
    }
  }

  await marcarError(applicationId, ultimoError);
  return { ok: false, error: ultimoError };
}

async function marcarError(applicationId: string, mensaje: string) {
  await db.aiEvaluation.upsert({
    where: { applicationId },
    create: { applicationId, estado: "error", intentos: MAX_INTENTOS, ultimoError: mensaje },
    update: { estado: "error", intentos: MAX_INTENTOS, ultimoError: mensaje },
  });
}

/** Procesa las pendientes por lote. Se limita el tamaño para no agotar el
 *  tiempo de ejecución de la función. */
export async function evaluarPendientes(limite = 10) {
  const pendientes = await db.aiEvaluation.findMany({
    where: { estado: { in: ["pending", "error"] } },
    select: { applicationId: true },
    take: limite,
  });

  let ok = 0;
  let fallidas = 0;
  for (const p of pendientes) {
    const r = await evaluarConIA(p.applicationId);
    if (r.ok) ok++;
    else fallidas++;
  }

  return { procesadas: pendientes.length, ok, fallidas };
}
