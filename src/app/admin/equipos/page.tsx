import { requiereRol } from "@/lib/sesion";
import { db } from "@/lib/db";
import { edicionActual } from "@/lib/edicion";
import { TECNOLOGIAS } from "@/lib/constantes";
import { fechaCorta } from "@/lib/fechas";
import { Etiqueta, Titulo, Vacio } from "@/components/ui";
import { GestorEquipos } from "./gestor";

export const metadata = { title: "Equipos Demo Day · Administración ANUIES4MX" };

export default async function Equipos() {
  await requiereRol("admin");
  const edicion = await edicionActual();

  const [equipos, sinEquipo] = await Promise.all([
    db.team.findMany({
      orderBy: { creadoEn: "asc" },
      include: {
        integrantes: {
          include: { universidad: { select: { siglas: true } } },
          orderBy: { folio: "asc" },
        },
      },
    }),
    db.application.findMany({
      where: {
        dictamen: "selected",
        equipoId: null,
        NOT: { confirmacion: { is: { estado: "declinada" } } },
      },
      include: { universidad: { select: { siglas: true } } },
      orderBy: { folio: "asc" },
    }),
  ]);

  const aFila = (a: {
    id: string;
    folio: string;
    datos: { nombreCompleto?: string | null } | null;
    universidad: { siglas: string } | null;
    propuesta: { tecnologia?: string | null } | null;
  }) => ({
    id: a.id,
    folio: a.folio,
    nombre: a.datos?.nombreCompleto ?? "Sin nombre",
    universidad: a.universidad?.siglas ?? "—",
    tecnologia: a.propuesta?.tecnologia
      ? TECNOLOGIAS[a.propuesta.tecnologia as keyof typeof TECNOLOGIAS]
      : "—",
  });

  return (
    <div className="max-w-[1140px] px-8 pb-16 pt-10">
      <Etiqueta className="tracking-[0.14em]">
        Demo Day · {fechaCorta(edicion.eventoTermina)}
      </Etiqueta>
      <Titulo className="mb-6 mt-1.5 text-[40px]">Equipos</Titulo>

      {equipos.length === 0 && sinEquipo.length === 0 ? (
        <Vacio
          titulo="Todavía no hay seleccionadas"
          detalle="Los equipos se arman con las aplicantes que reciban dictamen favorable. Publica los resultados de la evaluación para poder integrarlos."
        />
      ) : (
        <GestorEquipos
          equipos={equipos.map((e) => ({
            id: e.id,
            nombre: e.nombre,
            tecnologia: TECNOLOGIAS[e.tecnologia],
            integrantes: e.integrantes.map(aFila),
          }))}
          sinEquipo={sinEquipo.map(aFila)}
        />
      )}
    </div>
  );
}
