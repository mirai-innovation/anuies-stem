import { requiereRol } from "@/lib/sesion";
import { Shell } from "@/components/shell";

export default async function LayoutAplicante({ children }: { children: React.ReactNode }) {
  const usuario = await requiereRol("applicant");
  return <Shell usuario={usuario}>{children}</Shell>;
}
