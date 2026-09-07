import { requiereRol } from "@/lib/sesion";
import { ListaAplicaciones } from "@/components/revision/lista";
import type { FiltrosLista } from "@/lib/lista";

export const metadata = { title: "Aplicaciones · Administración ANUIES4MX" };

export default async function AplicacionesAdmin({
  searchParams,
}: {
  searchParams: Promise<FiltrosLista>;
}) {
  const usuario = await requiereRol("admin");
  const filtros = await searchParams;
  return <ListaAplicaciones rol={usuario.rol} filtros={filtros} base="/admin/aplicaciones" />;
}
