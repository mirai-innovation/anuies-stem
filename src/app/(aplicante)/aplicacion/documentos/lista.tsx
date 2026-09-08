"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TipoDocumento } from "@prisma/client";
import { Aviso, Barra, BotonEnlace, Chip, Tarjeta } from "@/components/ui";
import { Autoguardado } from "../autoguardado";
import { MAX_PDF_BYTES } from "@/lib/constantes";
import { pesoArchivo } from "@/lib/fechas";
import { confirmarDocumento } from "../subidas";
import { useSubida } from "../subidor";

type Fila = {
  tipo: TipoDocumento;
  nombre: string;
  ayuda: string;
  subido: { nombreOriginal: string; tamanoBytes: number; subidoEn: string } | null;
};

function FilaDocumento({ fila }: { fila: Fila }) {
  const router = useRouter();
  const { estado, input, manejar, limpiarError } = useSubida(
    "documento",
    (key, nombre) => confirmarDocumento(fila.tipo, key, nombre),
    () => router.refresh(),
  );

  const ocupado = estado.fase === "subiendo" || estado.fase === "verificando";
  const idInput = `archivo-${fila.tipo}`;

  return (
    <div className="border-b border-linea py-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[14px] font-semibold">{fila.nombre}</span>
            <Chip tono={fila.subido ? "teal" : "rosa"}>{fila.subido ? "Cargado" : "Falta"}</Chip>
          </div>
          <p className="mt-1 text-[12.5px] text-gris">{fila.ayuda}</p>
          {fila.subido && (
            <p className="mt-1.5 font-mono text-[11px] text-gris">
              {fila.subido.nombreOriginal} · {pesoArchivo(fila.subido.tamanoBytes)}
            </p>
          )}
        </div>

        <div className="flex flex-none items-center gap-3">
          {fila.subido && (
            <Link
              href={`/archivo/mio/documento/${fila.tipo}`}
              target="_blank"
              className="font-mono text-[11px] uppercase tracking-[0.06em]"
            >
              Ver PDF
            </Link>
          )}
          <>
              <label
                htmlFor={idInput}
                className={`inline-flex cursor-pointer items-center border border-linea-fuerte px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] hover:border-rosa hover:text-rosa ${
                  ocupado ? "pointer-events-none opacity-45" : ""
                }`}
              >
                {fila.subido ? "Reemplazar" : "Subir PDF"}
              </label>
              <input
                id={idInput}
                ref={input}
                type="file"
                accept="application/pdf"
                className="sr-only"
                disabled={ocupado}
                onChange={(e) => {
                  const a = e.target.files?.[0];
                  if (a) void manejar(a);
                }}
              />
          </>
        </div>
      </div>

      {estado.fase === "subiendo" && (
        <div className="mt-3">
          <div className="mb-1.5 font-mono text-[10.5px] text-gris">
            Subiendo · {estado.nombre} · {estado.pct}%
          </div>
          <Barra valor={estado.pct / 100} />
        </div>
      )}
      {estado.fase === "verificando" && (
        <p className="mt-3 font-mono text-[10.5px] text-gris">Verificando el archivo…</p>
      )}
      {estado.fase === "error" && (
        <div className="mt-3">
          <Aviso>
            {estado.mensaje}{" "}
            <button onClick={limpiarError} className="underline" type="button">
              Cerrar
            </button>
          </Aviso>
        </div>
      )}
    </div>
  );
}

export function ListaDocumentos({
  documentos,
  guardadaEn,
}: {
  documentos: Fila[];
  guardadaEn: string | null;
}) {
  const faltan = documentos.filter((d) => !d.subido).length;
  const entregados = documentos.length - faltan;

  return (
    <>
      <Tarjeta className="mb-6">
        <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-gris">
            Avance de documentos
          </div>
          <div className="font-mono text-[13px] font-semibold text-rosa">
            {entregados} de {documentos.length} documentos
          </div>
        </div>
        <Barra valor={entregados / documentos.length} tono={faltan === 0 ? "teal" : "rosa"} />
        <p className="mt-4 text-[13px] leading-relaxed text-gris">
          {faltan === 0
            ? "Están los cinco. Puedes reemplazar cualquiera antes de enviar."
            : `Te ${faltan === 1 ? "falta 1 documento" : `faltan ${faltan} documentos`} para poder enviar tu postulación.`}
        </p>
      </Tarjeta>

      <Tarjeta>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-gris">
            Documentos oficiales
          </div>
          <div className="font-mono text-[11px] text-gris">
            PDF · máx. {pesoArchivo(MAX_PDF_BYTES)} por archivo
          </div>
        </div>
        {documentos.map((d) => (
          <FilaDocumento key={d.tipo} fila={d} />
        ))}
      </Tarjeta>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Autoguardado guardadaEn={guardadaEn} />
          {faltan > 0 && (
            <span className="font-mono text-[10.5px] text-rosa-oscuro">
              {faltan === 1 ? "Falta 1 documento" : `Faltan ${faltan} documentos`}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <BotonEnlace href="/aplicacion/propuesta" variante="secundario">
            ← Volver a propuesta
          </BotonEnlace>
          <BotonEnlace href="/aplicacion/revision">Revisar y enviar →</BotonEnlace>
        </div>
      </div>
    </>
  );
}
