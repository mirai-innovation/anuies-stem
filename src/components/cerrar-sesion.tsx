import { signOut } from "@/auth";

export function CerrarSesion() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        title="Cerrar sesión"
        className="cursor-pointer border-0 bg-transparent p-1 font-mono text-[10px] uppercase tracking-[0.08em] text-gris hover:text-rosa"
      >
        Salir
      </button>
    </form>
  );
}
