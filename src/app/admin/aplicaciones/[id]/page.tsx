import { requiereRol } from "@/lib/sesion";
import { DetalleAplicacion } from "@/components/revision/detalle";

export const metadata = { title: "Evaluar aplicación · Administración ANUIES4MX" };

export default async function DetalleAdmin({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requiereRol("admin");
  const { id } = await params;
  return (
    <DetalleAplicacion
      id={id}
      rol={usuario.rol}
      usuarioId={usuario.id}
      base="/admin/aplicaciones"
    />
  );
}
