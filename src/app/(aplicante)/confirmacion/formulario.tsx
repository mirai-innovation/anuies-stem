"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { TALLAS } from "@/lib/constantes";
import { Aviso, Boton, Campo, Entrada, Etiqueta, Seleccion, Tarjeta } from "@/components/ui";
import { confirmarParticipacion, declinarLugar, type EstadoConfirmar } from "./acciones";

const VACIO: EstadoConfirmar = {};

export function FormularioConfirmacion({ cierra }: { cierra: string }) {
  const router = useRouter();
  const [estado, accion, enviando] = useActionState(confirmarParticipacion, VACIO);
  const [declinando, setDeclinando] = useState(false);
  const [confirmandoDeclinar, setConfirmandoDeclinar] = useState(false);
  const err = estado.errores ?? {};

  return (
    <form action={accion} noValidate className="grid gap-6">
      {estado.error && <Aviso>{estado.error}</Aviso>}

      <Tarjeta>
        <div className="grid gap-3">
          <div className={err.confirmoParticipacion ? "border border-rosa-oscuro p-3" : ""}>
            <label className="flex items-start gap-2.5 text-[13px] leading-relaxed">
              <input
                type="checkbox"
                name="confirmoParticipacion"
                value="1"
                className="mt-0.5 accent-[#D6336C]"
              />
              <span>
                <strong>Confirmo mi participación</strong> presencial y residencial durante los
                cinco días del programa.
              </span>
            </label>
            {err.confirmoParticipacion && (
              <p role="alert" className="mt-2 font-mono text-[10px] text-rosa-oscuro">
                {err.confirmoParticipacion}
              </p>
            )}
          </div>

          <div className={err.aceptaTerminos ? "border border-rosa-oscuro p-3" : ""}>
            <label className="flex items-start gap-2.5 text-[13px] leading-relaxed">
              <input
                type="checkbox"
                name="aceptaTerminos"
                value="1"
                className="mt-0.5 accent-[#D6336C]"
              />
              <span>
                Acepto los términos de la beca y el reglamento del Centro de Capacitación ANUIES.
              </span>
            </label>
            {err.aceptaTerminos && (
              <p role="alert" className="mt-2 font-mono text-[10px] text-rosa-oscuro">
                {err.aceptaTerminos}
              </p>
            )}
          </div>
        </div>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta className="mb-5 text-rosa">Datos logísticos</Etiqueta>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="ciudadOrigen" etiqueta="Ciudad de origen" error={err.ciudadOrigen}>
            <Entrada
              id="ciudadOrigen"
              name="ciudadOrigen"
              placeholder="Ciudad de México"
              aria-invalid={Boolean(err.ciudadOrigen)}
            />
          </Campo>
          <Campo
            id="requerimientosAlimentarios"
            etiqueta="Requerimientos alimentarios"
            ayuda="Opcional"
          >
            <Entrada
              id="requerimientosAlimentarios"
              name="requerimientosAlimentarios"
              placeholder="Vegetariana, alergias…"
            />
          </Campo>
          <Campo
            id="contactoEmergencia"
            etiqueta="Contacto de emergencia"
            error={err.contactoEmergencia}
          >
            <Entrada
              id="contactoEmergencia"
              name="contactoEmergencia"
              placeholder="Nombre y teléfono"
              aria-invalid={Boolean(err.contactoEmergencia)}
            />
          </Campo>
          <Campo id="tallaPlayera" etiqueta="Talla de playera" error={err.tallaPlayera}>
            <Seleccion
              id="tallaPlayera"
              name="tallaPlayera"
              defaultValue=""
              aria-invalid={Boolean(err.tallaPlayera)}
            >
              <option value="">Selecciona…</option>
              {TALLAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Seleccion>
          </Campo>
        </div>
      </Tarjeta>

      <div className="flex flex-wrap items-center gap-3">
        <Boton type="submit" disabled={enviando || declinando}>
          {enviando ? "Confirmando…" : "Confirmar participación →"}
        </Boton>

        {confirmandoDeclinar ? (
          <div className="flex flex-wrap items-center gap-3 border border-linea-fuerte px-4 py-2.5">
            <span className="text-[12.5px] text-gris">
              Declinar libera tu lugar y no se puede deshacer.
            </span>
            <Boton
              type="button"
              variante="secundario"
              disabled={declinando}
              onClick={async () => {
                setDeclinando(true);
                await declinarLugar();
                router.refresh();
              }}
            >
              {declinando ? "Registrando…" : "Sí, declinar"}
            </Boton>
            <button
              type="button"
              onClick={() => setConfirmandoDeclinar(false)}
              className="cursor-pointer border-0 bg-transparent font-mono text-[11px] uppercase tracking-[0.08em] text-gris underline"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoDeclinar(true)}
            className="cursor-pointer border-0 bg-transparent px-2 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-gris underline hover:text-rosa-oscuro"
          >
            Declinar mi lugar
          </button>
        )}
      </div>

      <p className="font-mono text-[10.5px] text-gris">
        Tienes hasta el {cierra} para responder.
      </p>
    </form>
  );
}
