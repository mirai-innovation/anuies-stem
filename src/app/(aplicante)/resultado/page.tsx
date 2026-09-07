import { requiereRol } from "@/lib/sesion";
import { edicionActual, resultadosPublicados } from "@/lib/edicion";
import { CRITERIOS, DICTAMENES } from "@/lib/constantes";
import { fecha, fechaCorta } from "@/lib/fechas";
import { BotonEnlace, Etiqueta, Tarjeta, Titulo } from "@/components/ui";
import { aplicacionDe } from "../aplicacion-actual";

export const metadata = { title: "Mi resultado · Reto ANUIES4MX 2026" };

/** Los cinco puntos de la escala 1–5 del diseño. */
function Escala({ valor }: { valor: number }) {
  return (
    <div className="flex gap-1.5" role="img" aria-label={`${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`size-2.5 ${n <= valor ? "bg-rosa" : "border border-linea-fuerte bg-superficie"}`}
        />
      ))}
    </div>
  );
}

export default async function Resultado() {
  const usuario = await requiereRol("applicant");
  const edicion = await edicionActual();
  const app = await aplicacionDe(usuario.id);
  const publicados = resultadosPublicados(edicion);

  if (!app) {
    return (
      <div className="max-w-[1000px] px-8 pb-16 pt-10">
        <Etiqueta>Resultados</Etiqueta>
        <Titulo className="mt-1.5 text-[40px]">Sin aplicación</Titulo>
        <Tarjeta className="mt-6">
          <p className="max-w-[62ch] text-sm leading-relaxed text-gris">
            No hay una aplicación registrada con esta cuenta.
          </p>
        </Tarjeta>
      </div>
    );
  }

  // Antes de la publicación no se filtra nada: ni el puntaje, ni el dictamen,
  // ni siquiera de forma indirecta.
  if (!publicados) {
    const enviada = app.estado !== "draft";
    return (
      <div className="max-w-[1000px] px-8 pb-16 pt-10">
        <Etiqueta className="tracking-[0.14em]">
          Resultados · se publican el {fechaCorta(edicion.resultadosPublicadosEn ?? edicion.evaluacionTermina)}
        </Etiqueta>
        <Titulo className="mb-6 mt-1.5 text-[40px]">Evaluación de mi aplicación</Titulo>

        <Tarjeta tono="oscura">
          <Etiqueta className="mb-3 text-gris-claro">Estado</Etiqueta>
          <div className="font-titulo text-[34px] font-bold uppercase leading-tight">
            {enviada ? "En evaluación" : "Tu aplicación no ha sido enviada"}
          </div>
          <p className="mt-3 max-w-[62ch] text-[13.5px] leading-relaxed text-gris-claro">
            {enviada
              ? `El comité evalúa las propuestas del ${fechaCorta(edicion.evaluacionInicia)} al ${fechaCorta(edicion.evaluacionTermina)}. Los dictámenes se publican después de esa fecha; hasta entonces no hay resultados que mostrar.`
              : `Todavía puedes completar y enviar tu aplicación hasta el ${fecha(edicion.cierreRecepcion)}.`}
          </p>
          {!enviada && (
            <BotonEnlace href="/aplicacion/revision" variante="brillante" className="mt-5">
              Ir a revisión y envío →
            </BotonEnlace>
          )}
        </Tarjeta>
      </div>
    );
  }

  const dictamen = app.dictamen;
  const criterios = app.criteriosComite;
  const retro = app.retroalimentacionPublicada;

  const mensajePorDictamen: Record<string, string> = {
    selected: `Tu propuesta fue elegida para el Reto ANUIES4MX en Valle de Bravo, ${fechaCorta(edicion.eventoInicia)} — ${fechaCorta(edicion.eventoTermina)}. Confirma tu participación antes del ${fecha(edicion.confirmacionCierra, "d 'de' MMMM")}.`,
    waitlist:
      "Tu propuesta quedó en lista de espera. Si se libera un lugar, la coordinación te contactará por este medio.",
    rejected:
      "En esta edición tu propuesta no fue seleccionada. La retroalimentación del comité está abajo para que puedas fortalecerla.",
  };

  return (
    <div className="max-w-[1000px] px-8 pb-16 pt-10">
      <Etiqueta className="tracking-[0.14em]">
        Resultados · publicados {fechaCorta(edicion.resultadosPublicadosEn)}
      </Etiqueta>
      <Titulo className="mb-6 mt-1.5 text-[40px]">Evaluación de mi aplicación</Titulo>

      <Tarjeta className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-[280px] flex-1">
            <Etiqueta>Resultado</Etiqueta>
            <div
              className={`mt-1.5 font-titulo text-[38px] font-extrabold uppercase leading-none ${
                dictamen === "selected" ? "text-teal" : "text-rosa"
              }`}
            >
              {dictamen ? DICTAMENES[dictamen] : "Sin dictamen"}
            </div>
            <p className="mt-3 max-w-[52ch] text-[13.5px] leading-relaxed text-gris">
              {dictamen ? mensajePorDictamen[dictamen] : "El comité aún no registró un dictamen."}
            </p>
          </div>

          <div className="flex gap-8">
            <div>
              <Etiqueta>Puntaje final</Etiqueta>
              <div className="mt-1 font-titulo text-[38px] font-extrabold leading-none text-tinta">
                {app.puntajeComite?.toFixed(1) ?? "—"}
                <span className="text-[18px] text-gris"> / 5</span>
              </div>
            </div>
            <div>
              <Etiqueta>Folio</Etiqueta>
              <div className="mt-2 font-mono text-[14px] text-tinta">{app.folio}</div>
            </div>
          </div>
        </div>

        {dictamen === "selected" && (
          <BotonEnlace href="/confirmacion" className="mt-6">
            Confirmar mi participación →
          </BotonEnlace>
        )}
      </Tarjeta>

      {criterios && (
        <Tarjeta className="mb-6">
          <Etiqueta className="mb-5">Calificación por criterio · escala 1 a 5</Etiqueta>
          <div className="grid gap-4">
            {CRITERIOS.map((c) => {
              const valor = criterios[c.clave];
              return (
                <div
                  key={c.clave}
                  className="grid grid-cols-[1fr_auto_36px] items-center gap-4 border-b border-linea pb-3.5 last:border-b-0 last:pb-0"
                >
                  <div>
                    <div className="text-[13.5px] font-medium">{c.nombre}</div>
                    <div className="mt-0.5 text-[12.5px] text-gris">{c.descripcion}</div>
                  </div>
                  <Escala valor={valor} />
                  <div className="text-right font-mono text-[13px] font-semibold">{valor}</div>
                </div>
              );
            })}
          </div>
        </Tarjeta>
      )}

      {retro && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Tarjeta tono="teal">
            <Etiqueta className="mb-3 text-teal-oscuro">Fortalezas señaladas por el comité</Etiqueta>
            <p className="m-0 text-[13.5px] leading-relaxed text-tinta">{retro.fortalezas}</p>
          </Tarjeta>
          <Tarjeta>
            <Etiqueta className="mb-3 text-rosa">Áreas de oportunidad</Etiqueta>
            <p className="m-0 text-[13.5px] leading-relaxed text-tinta">{retro.areasOportunidad}</p>
          </Tarjeta>
        </div>
      )}
    </div>
  );
}
