import { requiereRol } from "@/lib/sesion";
import { edicionActual, resultadosPublicados } from "@/lib/edicion";
import { datosPanel } from "@/lib/panel";
import { fechaCorta, fechaHora } from "@/lib/fechas";
import { Barra, Etiqueta, Tarjeta, Titulo } from "@/components/ui";
import { AccionesPanel } from "./acciones-panel";

export const metadata = { title: "Panel general · Administración ANUIES4MX" };

export default async function Panel() {
  await requiereRol("admin");
  const edicion = await edicionActual();
  const d = await datosPanel();
  const publicados = resultadosPublicados(edicion);

  const kpis = [
    { label: "Recibidas", value: String(d.recibidas), note: `${d.borradores} en borrador` },
    {
      label: "Evaluadas",
      value: String(d.evaluadas),
      note: `${d.recibidas - d.evaluadas} pendientes`,
    },
    { label: "Seleccionadas", value: String(d.seleccionadas), note: `${d.listaEspera} en espera` },
    {
      label: "Promedio comité",
      value: d.promedio ? d.promedio.toFixed(2) : "—",
      note: "Sobre 5 puntos",
    },
    { label: "Confirmadas", value: String(d.confirmadas), note: "Participación aceptada" },
  ];

  const avance = [
    {
      label: "Evaluación del comité",
      valor: d.recibidas ? d.evaluadas / d.recibidas : 0,
      texto: `${d.evaluadas} / ${d.recibidas}`,
    },
    {
      label: "Evaluación por IA",
      valor: d.recibidas ? d.conIA / d.recibidas : 0,
      texto: `${d.conIA} / ${d.recibidas}`,
    },
    {
      label: "Dictámenes emitidos",
      valor: d.recibidas ? (d.seleccionadas + d.listaEspera) / d.recibidas : 0,
      texto: `${d.seleccionadas + d.listaEspera} / ${d.recibidas}`,
    },
    {
      label: "Confirmaciones",
      valor: d.seleccionadas ? d.confirmadas / d.seleccionadas : 0,
      texto: `${d.confirmadas} / ${d.seleccionadas}`,
    },
  ];

  const calendario = [
    { label: "Cierre de recepción", fecha: fechaCorta(edicion.cierreRecepcion), destacado: false },
    {
      label: "Evaluación",
      fecha: `${fechaCorta(edicion.evaluacionInicia)} — ${fechaCorta(edicion.evaluacionTermina)}`,
      destacado: false,
    },
    {
      label: "Publicación de resultados",
      fecha: publicados
        ? fechaCorta(edicion.resultadosPublicadosEn)
        : fechaCorta(edicion.evaluacionTermina),
      destacado: false,
    },
    {
      label: "Reto presencial",
      fecha: `${fechaCorta(edicion.eventoInicia)} — ${fechaCorta(edicion.eventoTermina)}`,
      destacado: true,
    },
  ];

  return (
    <div className="max-w-[1140px] px-8 pb-16 pt-10">
      <Etiqueta className="tracking-[0.14em]">Administración · Edición {edicion.clave}</Etiqueta>
      <Titulo className="mb-6 mt-1.5 text-[40px]">Panel general</Titulo>

      <div className="mb-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Tarjeta key={k.label} className="p-5">
            <Etiqueta className="text-[9.5px]">{k.label}</Etiqueta>
            <div className="mt-2 font-titulo text-[36px] font-extrabold leading-none">{k.value}</div>
            <div className="mt-1 font-mono text-[10.5px] text-rosa">{k.note}</div>
          </Tarjeta>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Tarjeta>
          <Etiqueta className="mb-5">Avance de evaluación</Etiqueta>
          <div className="grid gap-4">
            {avance.map((p) => (
              <div key={p.label}>
                <div className="mb-2 flex justify-between text-[13px]">
                  <span>{p.label}</span>
                  <span className="font-mono text-gris">{p.texto}</span>
                </div>
                <Barra valor={p.valor} />
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-linea pt-5">
            <AccionesPanel
              iaPendientes={d.iaPendiente + d.iaError}
              publicados={publicados}
              publicadosEn={publicados ? fechaHora(edicion.resultadosPublicadosEn) : null}
              sinEvaluar={d.recibidas - d.evaluadas}
            />
          </div>
        </Tarjeta>

        <div className="grid gap-6">
          <Tarjeta>
            <Etiqueta className="mb-4">Aplicaciones por tecnología</Etiqueta>
            <div className="grid gap-3">
              {d.tecnologias.map((t) => (
                <div key={t.clave} className="grid grid-cols-[1fr_50px] items-center gap-3">
                  <div>
                    <div className="mb-1.5 text-[13px]">{t.label}</div>
                    <div className="h-1.5 bg-linea">
                      <div className="h-1.5 bg-teal" style={{ width: t.pct }} />
                    </div>
                  </div>
                  <div className="text-right font-mono text-[12px] text-gris">{t.n}</div>
                </div>
              ))}
            </div>
          </Tarjeta>

          <Tarjeta tono="oscura">
            <Etiqueta className="mb-3.5 text-teal-brillante">Calendario</Etiqueta>
            <div className="grid gap-3 text-[13px]">
              {calendario.map((c, i) => (
                <div
                  key={c.label}
                  className={`flex justify-between gap-3.5 ${
                    i < calendario.length - 1 ? "border-b border-tinta-clara/12 pb-2.5" : ""
                  }`}
                >
                  <span className={c.destacado ? "text-rosa-brillante" : ""}>{c.label}</span>
                  <span
                    className={`font-mono ${c.destacado ? "text-rosa-brillante" : "text-gris-claro"}`}
                  >
                    {c.fecha}
                  </span>
                </div>
              ))}
            </div>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
