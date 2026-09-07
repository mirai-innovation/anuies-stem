import { requiereRol } from "@/lib/sesion";
import { db } from "@/lib/db";
import { fechaCorta } from "@/lib/fechas";
import { Etiqueta, Titulo } from "@/components/ui";
import { GestorUsuarios } from "./gestor";

export const metadata = { title: "Usuarios y roles · Administración ANUIES4MX" };

export default async function Usuarios() {
  const actor = await requiereRol("admin");

  const usuarios = await db.user.findMany({
    orderBy: [{ rol: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      organizacion: true,
      emailVerifiedAt: true,
      creadoEn: true,
      _count: { select: { evaluaciones: true } },
    },
  });

  return (
    <div className="max-w-[1140px] px-8 pb-16 pt-10">
      <Etiqueta className="tracking-[0.14em]">Administración · Cuentas</Etiqueta>
      <Titulo className="mb-6 mt-1.5 text-[40px]">Usuarios y roles</Titulo>

      <GestorUsuarios
        actorId={actor.id}
        usuarios={usuarios.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          email: u.email,
          rol: u.rol,
          organizacion: u.organizacion,
          verificado: Boolean(u.emailVerifiedAt),
          creadoEn: fechaCorta(u.creadoEn),
          evaluaciones: u._count.evaluaciones,
        }))}
      />
    </div>
  );
}
