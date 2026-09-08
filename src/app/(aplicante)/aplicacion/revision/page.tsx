import { requiereRol } from "@/lib/sesion";
import { edicionActual } from "@/lib/edicion";
import { checklist, puedeEnviar } from "@/lib/aplicacion";
import { TECNOLOGIAS, etiquetaPaso } from "@/lib/constantes";
import { fechaCorta } from "@/lib/fechas";
import { Etiqueta, Tarjeta, Titulo } from "@/components/ui";
import { aplicacionOFalla } from "../../aplicacion-actual";
import { NavPasos } from "../pasos";
import { FormularioEnvio } from "./formulario";

export const metadata = { title: "Revisión y envío · Reto ANUIES4MX 2026" };

export default async function PasoRevision() {
  const usuario = await requiereRol("applicant");
  const app = await aplicacionOFalla(usuario.id);
  const edicion = await edicionActual();


  const items = checklist(app, edicion.promedioMinimo);
  // La declaración de veracidad se firma en esta pantalla, así que para saber
  // si el resto está listo se evalúa como si ya estuviera marcada.
  const listo = puedeEnviar({ ...app, declaraVeracidad: true });

  return (
    <>
      <Etiqueta className="tracking-[0.14em]">{etiquetaPaso("revision")}</Etiqueta>
      <Titulo className="mb-6 mt-1.5 text-[40px]">Revisión y envío</Titulo>
      <NavPasos />

      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Tarjeta>
          <Etiqueta className="mb-5">Checklist de requisitos</Etiqueta>
          <ul className="m-0 grid list-none gap-4 p-0">
            {items.map((c) => (
              <li key={c.label} className="flex gap-3">
                <span
                  aria-hidden
                  className={`mt-0.5 grid size-4 flex-none place-items-center text-[10px] ${
                    c.ok ? "bg-teal-brillante text-tinta" : "bg-rosa-brillante text-tinta"
                  }`}
                >
                  {c.ok ? "✓" : "!"}
                </span>
                <div>
                  <div className="text-[13.5px] font-medium">
                    {c.label}
                    <span className="sr-only">{c.ok ? " — cumplido" : " — pendiente"}</span>
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-gris">{c.nota}</div>
                </div>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <div className="grid gap-6">
          <FormularioEnvio
            folio={app.folio}
            listo={listo}
            evaluacionInicia={fechaCorta(edicion.evaluacionInicia)}
            evaluacionTermina={fechaCorta(edicion.evaluacionTermina)}
          />

          <Tarjeta>
            <Etiqueta className="mb-4">Resumen</Etiqueta>
            <dl className="m-0 grid gap-3 text-[13.5px]">
              {[
                ["Propuesta", app.propuesta?.nombre ?? "—"],
                [
                  "Tecnología",
                  app.propuesta?.tecnologia ? TECNOLOGIAS[app.propuesta.tecnologia] : "—",
                ],
                ["Universidad", app.academicos?.universidad ?? "—"],
                [
                  "Promedio",
                  app.academicos?.promedio != null ? app.academicos.promedio.toFixed(1) : "—",
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-linea pb-2.5">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-gris">{k}</dt>
                  <dd className="m-0 text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
