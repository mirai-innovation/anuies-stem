import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Primitivas del diseno aprobado.
 *  Las tres que se repiten en todas las vistas —etiqueta mono en mayusculas,
 *  tarjeta de borde 1px y chip de estado— viven aqui para que un ajuste de
 *  paleta no obligue a tocar cada pantalla. Sin esquinas redondeadas. */

export function Etiqueta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`font-mono text-[10px] uppercase tracking-[0.12em] text-gris ${className}`}
    >
      {children}
    </div>
  );
}

export function Titulo({
  children,
  as: Tag = "h2",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag
      className={`font-titulo font-bold uppercase leading-none text-tinta ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Tarjeta({
  children,
  className = "",
  tono = "clara",
}: {
  children: ReactNode;
  className?: string;
  tono?: "clara" | "oscura" | "teal" | "acento";
}) {
  const tonos = {
    clara: "bg-superficie border border-linea",
    oscura: "bg-tinta text-tinta-clara border border-tinta",
    teal: "bg-teal-suave border border-teal-borde",
    acento: "bg-superficie border border-rosa",
  };
  return <div className={`${tonos[tono]} p-6 ${className}`}>{children}</div>;
}

export function Chip({
  children,
  tono = "rosa",
}: {
  children: ReactNode;
  tono?: "rosa" | "teal" | "gris";
}) {
  const tonos = {
    rosa: "bg-rosa-suave text-rosa-oscuro",
    teal: "bg-teal-suave text-teal-oscuro",
    gris: "bg-linea text-gris",
  };
  return (
    <span
      className={`inline-block font-mono text-[9.5px] uppercase tracking-[0.08em] px-2 py-1 ${tonos[tono]}`}
    >
      {children}
    </span>
  );
}

const ESTILOS_BOTON = {
  primario:
    "bg-rosa text-white border border-rosa hover:bg-rosa-oscuro hover:border-rosa-oscuro",
  secundario:
    "bg-superficie text-tinta border border-linea-fuerte hover:border-rosa hover:text-rosa",
  oscuro: "bg-tinta text-tinta-clara border border-tinta hover:bg-black",
  brillante: "bg-rosa-brillante text-tinta border-0 hover:bg-rosa hover:text-white",
} as const;

const BASE_BOTON =
  "inline-flex items-center justify-center gap-2 px-5 py-3 font-mono text-[11.5px] font-semibold uppercase tracking-[0.1em] cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed";

export function Boton({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: keyof typeof ESTILOS_BOTON }) {
  return (
    <button
      {...props}
      className={`${BASE_BOTON} ${ESTILOS_BOTON[variante]} ${className}`}
    />
  );
}

export function BotonEnlace({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: keyof typeof ESTILOS_BOTON }) {
  return (
    <Link
      {...props}
      className={`${BASE_BOTON} no-underline hover:no-underline ${ESTILOS_BOTON[variante]} ${className}`}
    />
  );
}

const BASE_CONTROL =
  "w-full border border-linea-fuerte bg-superficie px-3 py-3 text-sm text-tinta placeholder:text-gris-claro aria-[invalid=true]:border-rosa-oscuro";

export function Entrada({ className = "", ...props }: ComponentProps<"input">) {
  return <input {...props} className={`${BASE_CONTROL} ${className}`} />;
}

export function Seleccion({ className = "", ...props }: ComponentProps<"select">) {
  return <select {...props} className={`${BASE_CONTROL} ${className}`} />;
}

export function AreaTexto({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${BASE_CONTROL} resize-y ${className}`} />;
}

/** Campo con etiqueta asociada y hueco para el error. El mensaje se anuncia a
 *  lectores de pantalla y se ata al control con aria-describedby. */
export function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  children,
  className = "",
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-gris"
      >
        {etiqueta}
      </label>
      {children}
      {ayuda && !error && (
        <p className="mt-1.5 font-mono text-[10px] text-gris">{ayuda}</p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 font-mono text-[10px] text-rosa-oscuro"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Barra de avance. `valor` va de 0 a 1. */
export function Barra({ valor, tono = "rosa" }: { valor: number; tono?: "rosa" | "teal" }) {
  const pct = Math.round(Math.min(1, Math.max(0, valor)) * 100);
  return (
    <div className="h-1.5 w-full bg-linea">
      <div
        className={`h-1.5 ${tono === "rosa" ? "bg-rosa" : "bg-teal"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Estado vacio: toda lista de la app usa este mismo bloque. */
export function Vacio({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <div className="border border-dashed border-linea-fuerte bg-superficie px-6 py-14 text-center">
      <p className="font-titulo text-2xl font-bold uppercase text-gris">{titulo}</p>
      {detalle && <p className="mx-auto mt-2 max-w-[46ch] text-sm text-gris">{detalle}</p>}
    </div>
  );
}

/** Aviso en linea, para errores de formulario y confirmaciones. */
export function Aviso({
  tono = "error",
  children,
}: {
  tono?: "error" | "exito" | "info";
  children: ReactNode;
}) {
  const tonos = {
    error: "border-rosa-oscuro bg-rosa-suave text-rosa-oscuro",
    exito: "border-teal-borde bg-teal-suave text-teal-oscuro",
    info: "border-linea-fuerte bg-fondo text-gris",
  };
  return (
    <div role={tono === "error" ? "alert" : "status"} className={`border p-3 text-sm ${tonos[tono]}`}>
      {children}
    </div>
  );
}

export function Encabezado({
  etiqueta,
  titulo,
  children,
}: {
  etiqueta: string;
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Etiqueta>{etiqueta}</Etiqueta>
        <Titulo className="mt-1.5 text-[40px]">{titulo}</Titulo>
      </div>
      {children}
    </div>
  );
}
