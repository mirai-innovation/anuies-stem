"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Aviso, Boton, Campo, Entrada, Etiqueta, Tarjeta } from "@/components/ui";
import { crearCuenta, type EstadoRegistro } from "./acciones";

const VACIO: EstadoRegistro = {};

export function FormularioRegistro() {
  const [estado, accion, enviando] = useActionState(crearCuenta, VACIO);
  const err = estado.errores ?? {};

  if (estado.ok) {
    return (
      <Tarjeta>
        <Etiqueta className="mb-4 text-teal">Cuenta creada</Etiqueta>
        <h2 className="mb-3 font-titulo text-[30px] font-bold uppercase">
          Revisa tu correo
        </h2>
        <p className="max-w-[58ch] text-sm leading-relaxed text-gris">
          {estado.correoEnviado
            ? "Te enviamos un enlace para confirmar tu correo. Vence en 48 horas; hasta entonces no podrás iniciar sesión."
            : "Tu cuenta quedó creada, pero no pudimos enviar el correo de confirmación en este momento. Escribe a la coordinación de la convocatoria para activarla."}
        </p>
        <p className="mt-5 text-[13px] text-gris">
          ¿Ya confirmaste? <Link href="/login">Inicia sesión</Link>
        </p>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <Etiqueta className="mb-5 text-rosa">Datos de la cuenta</Etiqueta>

      {estado.error && (
        <div className="mb-5">
          <Aviso>{estado.error}</Aviso>
        </div>
      )}

      <form action={accion} noValidate className="grid gap-4">
        <Campo id="nombre" etiqueta="Nombre completo" error={err.nombre}>
          <Entrada
            id="nombre"
            name="nombre"
            autoComplete="name"
            placeholder="Nombre y apellidos"
            aria-invalid={Boolean(err.nombre)}
          />
        </Campo>

        <Campo id="email" etiqueta="Correo institucional" error={err.email}>
          <Entrada
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@universidad.mx"
            aria-invalid={Boolean(err.email)}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="password"
            etiqueta="Contraseña"
            ayuda="Mínimo 10 caracteres"
            error={err.password}
          >
            <Entrada
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={Boolean(err.password)}
            />
          </Campo>
          <Campo id="confirmar" etiqueta="Confirmar" error={err.confirmar}>
            <Entrada
              id="confirmar"
              name="confirmar"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={Boolean(err.confirmar)}
            />
          </Campo>
        </div>

        <div className="grid gap-3 border-t border-linea pt-4">
          <div className={err.declaraElegibilidad ? "border border-rosa-oscuro p-3" : ""}>
            <label className="flex items-start gap-2.5 text-[13px] leading-relaxed">
              <input
                type="checkbox"
                name="declaraElegibilidad"
                value="1"
                className="mt-0.5 accent-[#D6336C]"
              />
              <span>
                Declaro estar inscrita en un programa de educación superior en un área STEM y{" "}
                <strong>no cursar el último año</strong> de mi programa.
              </span>
            </label>
            {err.declaraElegibilidad && (
              <p role="alert" className="mt-2 font-mono text-[10px] text-rosa-oscuro">
                {err.declaraElegibilidad}
              </p>
            )}
          </div>

          <div className={err.aceptaAviso ? "border border-rosa-oscuro p-3" : ""}>
            <label className="flex items-start gap-2.5 text-[13px] leading-relaxed">
              <input
                type="checkbox"
                name="aceptaAviso"
                value="1"
                className="mt-0.5 accent-[#D6336C]"
              />
              <span>Acepto el aviso de privacidad y las bases de la convocatoria.</span>
            </label>
            {err.aceptaAviso && (
              <p role="alert" className="mt-2 font-mono text-[10px] text-rosa-oscuro">
                {err.aceptaAviso}
              </p>
            )}
          </div>
        </div>

        <Boton type="submit" disabled={enviando} className="mt-1 w-full py-3.5">
          {enviando ? "Creando cuenta…" : "Crear cuenta →"}
        </Boton>
      </form>
    </Tarjeta>
  );
}
