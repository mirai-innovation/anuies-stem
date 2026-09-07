import Link from "next/link";
import { db } from "@/lib/db";
import { consumirToken } from "@/lib/tokens";
import { BotonEnlace, Etiqueta, Tarjeta, Titulo } from "@/components/ui";

export const metadata = { title: "Confirmar correo · Reto ANUIES4MX 2026" };

export default async function Verificar({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let estado: "sin-token" | "invalido" | "ok" = "sin-token";

  if (token) {
    const userId = await consumirToken(token, "verificacion_correo");
    if (userId) {
      await db.user.update({
        where: { id: userId },
        data: { emailVerifiedAt: new Date() },
      });
      estado = "ok";
    } else {
      estado = "invalido";
    }
  }

  const contenido = {
    ok: {
      titulo: "Correo confirmado",
      texto: "Tu cuenta quedó activa. Ya puedes iniciar sesión y empezar tu postulación.",
    },
    invalido: {
      titulo: "Enlace no válido",
      texto:
        "El enlace ya se usó, venció o no corresponde a ninguna cuenta. Pide uno nuevo desde la pantalla de inicio de sesión.",
    },
    "sin-token": {
      titulo: "Falta el enlace",
      texto: "Abre el enlace completo que te llegó por correo.",
    },
  }[estado];

  return (
    <main className="grid min-h-screen place-items-center bg-fondo px-6">
      <Tarjeta className="w-full max-w-[520px]">
        <Etiqueta>Confirmación de correo</Etiqueta>
        <Titulo className="mb-3 mt-2 text-[34px]">{contenido.titulo}</Titulo>
        <p className="text-sm leading-relaxed text-gris">{contenido.texto}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <BotonEnlace href="/login">Ir a iniciar sesión</BotonEnlace>
          {estado !== "ok" && (
            <Link href="/registro" className="self-center text-[13px]">
              Crear una cuenta
            </Link>
          )}
        </div>
      </Tarjeta>
    </main>
  );
}
