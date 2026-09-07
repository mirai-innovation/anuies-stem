import { requiereRol } from "@/lib/sesion";
import { DetalleAplicacion } from "@/components/revision/detalle";

export const metadata = { title: "Detalle de aplicación · Reto ANUIES4MX 2026" };

export default async function DetalleAnuies({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requiereRol("anuies");
  const { id } = await params;
  return (
    <DetalleAplicacion id={id} rol={usuario.rol} usuarioId={usuario.id} base="/aplicaciones" />
  );
}
