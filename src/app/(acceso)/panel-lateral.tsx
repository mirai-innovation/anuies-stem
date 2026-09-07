import { Etiqueta } from "@/components/ui";
import { fechaCorta } from "@/lib/fechas";

/** Columna oscura de las pantallas de acceso. Es identica en login y registro,
 *  asi que vive en un solo lugar. */
export function PanelAcceso({
  cierre,
  eventoInicia,
  eventoTermina,
}: {
  cierre: Date;
  eventoInicia: Date;
  eventoTermina: Date;
}) {
  return (
    <div className="flex flex-col justify-between gap-10 bg-tinta px-8 py-14 text-tinta-clara sm:px-12">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gris-claro">
          ANUIES × Mirai Innovation Research Institute
        </div>
        <h1 className="mt-4 font-titulo text-[clamp(38px,5vw,60px)] font-extrabold uppercase leading-[0.92]">
          Reto ANUIES4MX
          <br />
          <span className="text-rosa-brillante">Mujeres STEM</span>
        </h1>
        <p className="mt-3.5 font-titulo text-[22px] font-medium">
          Negocios del Futuro con Tecnologías Emergentes
        </p>
        <p className="mt-5 max-w-[44ch] text-sm leading-relaxed text-gris-claro text-pretty">
          Plataforma de postulación y evaluación. Programa intensivo de 5 días en
          Valle de Bravo, con cierre en Demo Day ante jurado.
        </p>
      </div>
      <div className="flex flex-col gap-2.5 font-mono text-[11.5px] text-gris-claro">
        <div className="flex gap-2.5">
          <span className="text-teal-brillante">Cierre</span> {fechaCorta(cierre)} · 23:59 CST
        </div>
        <div className="flex gap-2.5">
          <span className="text-teal-brillante">Evento</span> {fechaCorta(eventoInicia)} —{" "}
          {fechaCorta(eventoTermina)} · Valle de Bravo
        </div>
      </div>
    </div>
  );
}

export function ColumnaFormulario({
  etiqueta,
  titulo,
  children,
}: {
  etiqueta: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center bg-superficie px-8 py-14 sm:px-12">
      <div className="w-full max-w-[380px]">
        <Etiqueta className="tracking-[0.14em]">{etiqueta}</Etiqueta>
        <h2 className="mb-7 mt-2 font-titulo text-[34px] font-bold uppercase">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
