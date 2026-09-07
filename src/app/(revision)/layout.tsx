import { requiereRol } from "@/lib/sesion";
import { Shell } from "@/components/shell";

export default async function LayoutRevision({ children }: { children: React.ReactNode }) {
  const usuario = await requiereRol("anuies");
  return <Shell usuario={usuario}>{children}</Shell>;
}
