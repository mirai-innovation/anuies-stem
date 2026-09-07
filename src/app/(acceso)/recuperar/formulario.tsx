"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Aviso, Boton, Campo, Entrada } from "@/components/ui";
import { cambiarPassword, pedirRecuperacion, type EstadoRecuperacion } from "./acciones";

const VACIO: EstadoRecuperacion = {};

export function FormularioPedir() {
  const [estado, accion, enviando] = useActionState(pedirRecuperacion, VACIO);

  if (estado.ok) {
    return (
      <div>
        <Aviso tono="exito">
          Si existe una cuenta con ese correo, te enviamos un enlace para cambiar la contraseña.
          Vence en una hora.
        </Aviso>
        <p className="mt-5 text-[13px] text-gris">
          <Link href="/login">Volver a iniciar sesión</Link>
        </p>
      </div>
    );
  }

  return (
    <form action={accion} noValidate>
      <p className="mb-5 text-[13.5px] leading-relaxed text-gris">
        Escribe tu correo institucional y te mandamos un enlace para elegir una contraseña nueva.
      </p>

      {estado.error && (
        <div className="mb-4">
          <Aviso>{estado.error}</Aviso>
        </div>
      )}

      <Campo id="email" etiqueta="Correo institucional" className="mb-5">
        <Entrada
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="nombre@universidad.mx"
        />
      </Campo>

      <Boton type="submit" disabled={enviando} className="w-full py-3.5">
        {enviando ? "Enviando…" : "Enviar enlace →"}
      </Boton>

      <p className="mt-6 border-t border-linea pt-6 text-[13px] text-gris">
        <Link href="/login">Volver a iniciar sesión</Link>
      </p>
    </form>
  );
}

export function FormularioCambiar({ token }: { token: string }) {
  const [estado, accion, enviando] = useActionState(cambiarPassword, VACIO);

  if (estado.ok) {
    return (
      <div>
        <Aviso tono="exito">Tu contraseña quedó actualizada.</Aviso>
        <p className="mt-5 text-[13px] text-gris">
          <Link href="/login">Iniciar sesión</Link>
        </p>
      </div>
    );
  }

  return (
    <form action={accion} noValidate>
      <input type="hidden" name="token" value={token} />

      {estado.error && (
        <div className="mb-4">
          <Aviso>{estado.error}</Aviso>
        </div>
      )}

      <Campo
        id="password"
        etiqueta="Contraseña nueva"
        ayuda="Mínimo 10 caracteres"
        className="mb-4"
      >
        <Entrada
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
        />
      </Campo>

      <Campo id="confirmar" etiqueta="Confirmar" className="mb-5">
        <Entrada
          id="confirmar"
          name="confirmar"
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
        />
      </Campo>

      <Boton type="submit" disabled={enviando} className="w-full py-3.5">
        {enviando ? "Guardando…" : "Cambiar contraseña →"}
      </Boton>
    </form>
  );
}
