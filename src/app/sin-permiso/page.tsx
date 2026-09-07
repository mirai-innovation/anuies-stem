import { BotonEnlace, Etiqueta, Titulo } from "@/components/ui";

export default function SinPermiso() {
  return (
    <main className="grid min-h-screen place-items-center bg-fondo px-6">
      <div className="max-w-[46ch] text-center">
        <Etiqueta>Acceso restringido</Etiqueta>
        <Titulo className="mt-2 text-[44px]">Sin permiso</Titulo>
        <p className="mt-4 text-sm leading-relaxed text-gris">
          Tu cuenta no tiene acceso a esta sección. Si crees que se trata de un
          error, escribe a la coordinación de la convocatoria.
        </p>
        <BotonEnlace href="/" variante="secundario" className="mt-7">
          Volver al inicio
        </BotonEnlace>
      </div>
    </main>
  );
}
