import { requiereRol } from "@/lib/sesion";
import { db } from "@/lib/db";
import { edicionActual } from "@/lib/edicion";
import { Etiqueta, Titulo } from "@/components/ui";
import { aplicacionOFalla } from "../../aplicacion-actual";
import { etiquetaPaso } from "@/lib/constantes";
import { NavPasos } from "../pasos";
import { FormularioDatos } from "./formulario";

export const metadata = { title: "Datos personales y académicos · Reto ANUIES4MX 2026" };

export default async function PasoDatos() {
  const usuario = await requiereRol("applicant");
  const app = await aplicacionOFalla(usuario.id);
  const edicion = await edicionActual();

  const universidades = await db.universidad.findMany({
    where: { activa: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  return (
    <>
      <Etiqueta className="tracking-[0.14em]">{etiquetaPaso("datos")}</Etiqueta>
      <Titulo className="mb-6 mt-1.5 text-[40px]">Datos personales y académicos</Titulo>
      <NavPasos />
      <FormularioDatos
        universidades={universidades}
        promedioMinimo={edicion.promedioMinimo}
        guardadaEn={app.guardadaEn ? app.guardadaEn.toISOString() : null}
        inicial={{
          nombreCompleto: app.datos?.nombreCompleto ?? usuario.nombre,
          curp: app.datos?.curp ?? "",
          fechaNacimiento: app.datos?.fechaNacimiento
            ? app.datos.fechaNacimiento.toISOString().slice(0, 10)
            : "",
          telefono: app.datos?.telefono ?? "",
          estadoResidencia: app.datos?.estadoResidencia ?? "",
          correoInstitucional: app.datos?.correoInstitucional ?? usuario.email,
          universidadId: app.academicos?.universidadId ?? "",
          programaEducativo: app.academicos?.programaEducativo ?? "",
          nivel: app.academicos?.nivel ?? "",
          semestre: app.academicos?.semestre ? String(app.academicos.semestre) : "",
          promedio: app.academicos?.promedio != null ? String(app.academicos.promedio) : "",
          areaStem: app.academicos?.areaStem ?? "",
          declaraNoUltimoAnio: app.academicos?.declaraNoUltimoAnio ?? false,
          nombrePropuesta: app.propuesta?.nombre ?? "",
          tecnologia: app.propuesta?.tecnologia ?? "",
          problema: app.propuesta?.problema ?? "",
          impacto: app.propuesta?.impacto ?? "",
        }}
      />
    </>
  );
}
