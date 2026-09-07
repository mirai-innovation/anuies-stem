"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Boton, Etiqueta, Tarjeta } from "@/components/ui";
import { enviarAplicacion, type EstadoGuardado } from "../acciones";

const VACIO: EstadoGuardado = {};

export function FormularioEnvio({
  folio,
  listo,
  evaluacionInicia,
  evaluacionTermina,
}: {
  folio: string;
  listo: boolean;
  evaluacionInicia: string;
  evaluacionTermina: string;
}) {
  const router = useRouter();
  const [estado, accion, enviando] = useActionState(enviarAplicacion, VACIO);

  useEffect(() => {
    if (estado.ok) router.push("/dashboard");
  }, [estado.ok, router]);

  return (
    <Tarjeta tono="acento">
      <Etiqueta className="mb-4 text-rosa">Antes de enviar</Etiqueta>
      <p className="mb-4 text-[13.5px] leading-relaxed text-tinta">
        Una vez enviada, tu aplicación entra al periodo de evaluación ({evaluacionInicia} —{" "}
        {evaluacionTermina}) y no podrá editarse. Puedes seguir guardando borradores hasta el
        cierre.
      </p>

      {estado.error && (
        <div className="mb-4">
          <Aviso>{estado.error}</Aviso>
        </div>
      )}

      {!listo && (
        <div className="mb-4">
          <Aviso tono="info">
            Aún hay requisitos pendientes en el checklist. Resuélvelos para habilitar el envío.
          </Aviso>
        </div>
      )}

      <form action={accion}>
        <label className="mb-5 flex items-start gap-2.5 text-[13px] leading-relaxed text-tinta">
          <input
            type="checkbox"
            name="declaraVeracidad"
            value="1"
            required
            className="mt-0.5 accent-[#D6336C]"
          />
          <span>Declaro que la información y los documentos son verídicos.</span>
        </label>

        <Boton type="submit" disabled={!listo || enviando} className="w-full py-3.5">
          {enviando ? "Enviando…" : "Enviar aplicación →"}
        </Boton>
      </form>

      <div className="mt-4 font-mono text-[10.5px] text-gris">Folio provisional: {folio}</div>
    </Tarjeta>
  );
}
