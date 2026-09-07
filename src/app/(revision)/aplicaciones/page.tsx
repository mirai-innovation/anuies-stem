import { requiereRol } from "@/lib/sesion";
import { ListaAplicaciones } from "@/components/revision/lista";
import type { FiltrosLista } from "@/lib/lista";

export const metadata = { title: "Aplicaciones · Reto ANUIES4MX 2026" };

export default async function Aplicaciones({
  searchParams,
}: {
  searchParams: Promise<FiltrosLista>;
}) {
  const usuario = await requiereRol("anuies");
  const filtros = await searchParams;
  return <ListaAplicaciones rol={usuario.rol} filtros={filtros} base="/aplicaciones" />;
}
