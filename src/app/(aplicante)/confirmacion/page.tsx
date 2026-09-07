import { requiereRol } from "@/lib/sesion";
import { confirmacionAbierta, edicionActual, resultadosPublicados } from "@/lib/edicion";
import { fecha, fechaCorta } from "@/lib/fechas";
import { Aviso, BotonEnlace, Etiqueta, Tarjeta, Titulo } from "@/components/ui";
import { aplicacionDe } from "../aplicacion-actual";
import { FormularioConfirmacion } from "./formulario";

export const metadata = { title: "Confirmar participación · Reto ANUIES4MX 2026" };

export default async function Confirmacion() {
  const usuario = await requiereRol("applicant");
  const edicion = await edicionActual();
  const app = await aplicacionDe(usuario.id);

  const encabezado = (
    <>
      <Etiqueta className="tracking-[0.14em]">
        Confirmación de participación · {fechaCorta(edicion.confirmacionAbre)} —{" "}
        {fechaCorta(edicion.confirmacionCierra)}
      </Etiqueta>
      <Titulo className="mb-4 mt-1.5 text-[40px]">Confirma tu lugar</Titulo>
    </>
  );

  const envoltura = (contenido: React.ReactNode) => (
    <div className="max-w-[1000px] px-8 pb-16 pt-10">
      {encabezado}
      {contenido}
    </div>
  );

  if (!app) return envoltura(<Tarjeta><p className="text-sm text-gris">No hay una aplicación registrada con esta cuenta.</p></Tarjeta>);

  if (!resultadosPublicados(edicion)) {
    return envoltura(
      <Tarjeta>
        <p className="max-w-[62ch] text-sm leading-relaxed text-gris">
          Los resultados todavía no se publican. La confirmación se habilita a partir del{" "}
          {fecha(edicion.confirmacionAbre)}, y solo para las aplicantes seleccionadas.
        </p>
      </Tarjeta>,
    );
  }

  if (app.dictamen !== "selected") {
    return envoltura(
      <Tarjeta>
        <p className="max-w-[62ch] text-sm leading-relaxed text-gris">
          Esta sección es solo para las aplicantes seleccionadas. Puedes consultar tu dictamen y la
          retroalimentación del comité en tu resultado.
        </p>
        <BotonEnlace href="/resultado" variante="secundario" className="mt-5">
          Ver mi resultado
        </BotonEnlace>
      </Tarjeta>,
    );
  }

  const conf = app.confirmacion;

  if (conf?.estado === "confirmada") {
    return envoltura(
      <Tarjeta tono="teal">
        <Etiqueta className="mb-3 text-teal-oscuro">Lugar confirmado</Etiqueta>
        <p className="max-w-[62ch] text-sm leading-relaxed text-tinta">
          Registramos tu confirmación el {fecha(conf.respondidoEn)}. Nos vemos en el Centro de
          Capacitación ANUIES de Valle de Bravo del {fechaCorta(edicion.eventoInicia)} al{" "}
          {fechaCorta(edicion.eventoTermina)}. La coordinación te escribirá con los detalles de
          traslado.
        </p>
      </Tarjeta>,
    );
  }

  if (conf?.estado === "declinada") {
    return envoltura(
      <Tarjeta>
        <Etiqueta className="mb-3">Lugar declinado</Etiqueta>
        <p className="max-w-[62ch] text-sm leading-relaxed text-gris">
          Registramos que declinaste tu lugar el {fecha(conf.respondidoEn)}. Si fue un error,
          escribe a la coordinación de la convocatoria lo antes posible.
        </p>
      </Tarjeta>,
    );
  }

  if (!confirmacionAbierta(edicion)) {
    const antes = new Date() < edicion.confirmacionAbre;
    return envoltura(
      <Aviso tono="info">
        {antes
          ? `La confirmación abre el ${fecha(edicion.confirmacionAbre)}.`
          : `La ventana de confirmación cerró el ${fecha(edicion.confirmacionCierra)}. Escribe a la coordinación si aún no respondiste.`}
      </Aviso>,
    );
  }

  return envoltura(
    <>
      <p className="mb-6 max-w-[70ch] text-sm leading-relaxed text-gris text-pretty">
        La beca cubre participación en el programa, hospedaje y alimentación en el Centro de
        Capacitación ANUIES Valle de Bravo del {fecha(edicion.eventoInicia, "d")} al{" "}
        {fecha(edicion.eventoTermina, "d 'de' MMMM 'de' yyyy")}.
      </p>
      <FormularioConfirmacion cierra={fecha(edicion.confirmacionCierra)} />
    </>,
  );
}
