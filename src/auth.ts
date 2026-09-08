import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Rol } from "@prisma/client";
import { db } from "@/lib/db";
import { verificarPassword } from "@/lib/password";

declare module "next-auth" {
  interface Session {
    user: { id: string; nombre: string; email: string; rol: Rol };
  }
  interface User {
    rol: Rol;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Sesión en JWT firmado dentro de una cookie httpOnly. Con credenciales no
  // hay adaptador de base de datos, así que no hay tabla de sesiones que
  // mantener en Mongo.
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  // Detrás del proxy de Vercel, el host real llega en las cabeceras
  // reenviadas. Sin esto, Auth.js armaría las URL de retorno con el host
  // interno y el inicio de sesión rebotaría a un sitio equivocado.
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(datos) {
        const email = String(datos?.email ?? "").trim().toLowerCase();
        const password = String(datos?.password ?? "");
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await verificarPassword(user.passwordHash, password);
        if (!ok) return null;

        // El correo sin verificar no entra: se distingue del password
        // incorrecto en la vista de login para poder reenviar el enlace.
        if (!user.emailVerifiedAt) return null;

        return { id: user.id, name: user.nombre, email: user.email, rol: user.rol };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as { rol: Rol }).rol;
      }
      return token;
    },
    session({ session, token }) {
      session.user = {
        id: token.id as string,
        nombre: (token.name ?? "") as string,
        email: (token.email ?? "") as string,
        rol: token.rol as Rol,
      } as typeof session.user;
      return session;
    },
  },
});
