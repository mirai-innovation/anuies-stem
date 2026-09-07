import { requiereRol } from "@/lib/sesion";
import { Shell } from "@/components/shell";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const usuario = await requiereRol("admin");
  return <Shell usuario={usuario}>{children}</Shell>;
}
