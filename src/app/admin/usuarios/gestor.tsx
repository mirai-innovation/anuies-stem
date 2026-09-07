"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Rol } from "@prisma/client";
import { ROLES } from "@/lib/constantes";
import { Aviso, Boton, Campo, Chip, Entrada, Etiqueta, Seleccion, Tarjeta } from "@/components/ui";
import { cambiarRol, crearCuentaInterna, type EstadoUsuario } from "./acciones";

const VACIO: EstadoUsuario = {};

type Fila = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  organizacion: string | null;
  verificado: boolean;
  creadoEn: string;
  evaluaciones: number;
};

export function GestorUsuarios({ usuarios, actorId }: { usuarios: Fila[]; actorId: string }) {
  const router = useRouter();
  const [estado, accionCrear, creando] = useActionState(crearCuentaInterna, VACIO);
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ tono: "exito" | "error"; texto: string } | null>(null);

  const aplicantes = usuarios.filter((u) => u.rol === "applicant");
  const internos = usuarios.filter((u) => u.rol !== "applicant");

  function cambiar(id: string, rol: Rol) {
    iniciar(async () => {
      const r = await cambiarRol(id, rol);
      setMensaje(
        r.error ? { tono: "error", texto: r.error } : { tono: "exito", texto: r.resumen ?? "Listo." },
      );
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      {mensaje && <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso>}

      <Tarjeta>
        <Etiqueta className="mb-4 text-rosa">Alta de cuenta interna</Etiqueta>
        <p className="mb-4 max-w-[68ch] text-[13px] leading-relaxed text-gris">
          No se define una contraseña aquí: la cuenta se crea con una clave aleatoria que nadie
          conoce y la persona elige la suya con el enlace de activación que recibe por correo.
        </p>

        {estado.error && (
          <div className="mb-4">
            <Aviso>{estado.error}</Aviso>
          </div>
        )}
        {estado.ok && (
          <div className="mb-4">
            <Aviso tono="exito">{estado.resumen}</Aviso>
          </div>
        )}

        <form action={accionCrear} className="flex flex-wrap items-end gap-4">
          <Campo id="nombre" etiqueta="Nombre completo" className="min-w-[200px] flex-1">
            <Entrada id="nombre" name="nombre" placeholder="Dra. Nombre Apellido" />
          </Campo>
          <Campo id="email" etiqueta="Correo" className="min-w-[220px] flex-1">
            <Entrada id="email" name="email" type="email" placeholder="nombre@anuies.mx" />
          </Campo>
          <Campo id="organizacion" etiqueta="Organización" className="min-w-[180px] flex-1">
            <Entrada id="organizacion" name="organizacion" placeholder="ANUIES" />
          </Campo>
          <Campo id="rol" etiqueta="Rol" className="min-w-[160px]">
            <Seleccion id="rol" name="rol" defaultValue="admin">
              <option value="admin">Administración (comité)</option>
              <option value="anuies">ANUIES (solo lectura)</option>
            </Seleccion>
          </Campo>
          <Boton type="submit" disabled={creando}>
            {creando ? "Creando…" : "Crear cuenta"}
          </Boton>
        </form>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta className="mb-4">Comité y ANUIES · {internos.length}</Etiqueta>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-fondo">
                {["Nombre", "Correo", "Organización", "Evaluaciones", "Alta", "Rol"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="border-b border-linea px-4 py-3 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-gris"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {internos.map((u) => (
                <tr key={u.id} className="border-b border-linea">
                  <td className="px-4 py-3 font-medium">
                    {u.nombre}
                    {u.id === actorId && (
                      <span className="ml-2 font-mono text-[10px] uppercase text-gris">(tú)</span>
                    )}
                    {!u.verificado && (
                      <span className="ml-2">
                        <Chip tono="rosa">Sin activar</Chip>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-gris">{u.email}</td>
                  <td className="px-4 py-3 text-gris">{u.organizacion ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-[12px]">{u.evaluaciones}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gris">{u.creadoEn}</td>
                  <td className="px-4 py-3">
                    <label htmlFor={`rol-${u.id}`} className="sr-only">
                      Rol de {u.nombre}
                    </label>
                    <Seleccion
                      id={`rol-${u.id}`}
                      value={u.rol}
                      disabled={pendiente}
                      onChange={(e) => cambiar(u.id, e.target.value as Rol)}
                      className="w-auto! py-1.5 text-[12px]"
                    >
                      <option value="admin">{ROLES.admin}</option>
                      <option value="anuies">{ROLES.anuies}</option>
                    </Seleccion>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta className="mb-2">Aplicantes · {aplicantes.length}</Etiqueta>
        <p className="mb-4 text-[13px] text-gris">
          Las cuentas de aplicante no cambian de rol: cada una está ligada a su postulación.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-fondo">
                {["Nombre", "Correo", "Correo verificado", "Alta"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="border-b border-linea px-4 py-3 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-gris"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aplicantes.map((u) => (
                <tr key={u.id} className="border-b border-linea">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-gris">{u.email}</td>
                  <td className="px-4 py-3">
                    <Chip tono={u.verificado ? "teal" : "rosa"}>{u.verificado ? "Sí" : "No"}</Chip>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gris">{u.creadoEn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </div>
  );
}
