import Link from "next/link";
import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/sesion";
import { edicionActual } from "@/lib/edicion";
import { fechaCorta } from "@/lib/fechas";
import { Etiqueta, Tarjeta, Titulo } from "@/components/ui";
import { FormularioRegistro } from "./formulario";

export const metadata = { title: "Registro de aplicante · Reto ANUIES4MX 2026" };

/** Lo que de verdad se necesita para postular. Los cinco documentos oficiales
 *  ya no van aquí: son del expediente, que solo integran las seleccionadas
 *  después de los resultados. Listarlos en el registro haría creer que hay que
 *  reunirlos antes de empezar. */
const TEN_A_LA_MANO = [
  "El nombre de tu universidad y de tu programa educativo.",
  "Tu promedio global acumulado: el mínimo es 9.0.",
  "Tu propuesta descrita en dos textos breves: el problema y el impacto esperado.",
  "Un video de propuesta de hasta 90 segundos, en MP4 o MOV.",
];

export default async function Registro() {
  if (await sesionActual()) redirect("/");

  const edicion = await edicionActual();

  return (
    <main className="mx-auto max-w-[1080px] px-7 pb-16 pt-11">
      <Etiqueta className="tracking-[0.14em]">Paso previo · crear cuenta</Etiqueta>
      <Titulo className="mb-1.5 mt-2 text-[40px]">Registro de aplicante</Titulo>
      <p className="mb-7 max-w-[62ch] text-sm text-gris text-pretty">
        Crea tu cuenta para iniciar la postulación. Podrás guardar tu avance y volver antes del{" "}
        {fechaCorta(edicion.cierreRecepcion)}.
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <FormularioRegistro />

        <Tarjeta tono="teal">
          <Etiqueta className="mb-4 text-teal-oscuro">Ten a la mano</Etiqueta>
          <ol className="m-0 grid list-decimal gap-2 pl-5 text-[13px] leading-snug text-tinta">
            {TEN_A_LA_MANO.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <p className="mt-4 text-[12.5px] leading-relaxed text-tinta">
            El video de presentación se graba aquí mismo con tu cámara, y los documentos
            oficiales solo se piden si resultas seleccionada.
          </p>
          <div className="mt-5 border-t border-teal-borde pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-teal-oscuro">
            Cierre de recepción
            <br />
            <strong className="text-[13px] tracking-[0.06em] text-tinta">
              {fechaCorta(edicion.cierreRecepcion)} · 23:59 CST
            </strong>
          </div>
        </Tarjeta>
      </div>

      <p className="mt-8 text-center text-[13px] text-gris">
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </main>
  );
}
