import { hash, verify } from "@node-rs/argon2";

/** argon2id con los parametros recomendados por OWASP. @node-rs/argon2 trae
 *  binarios precompilados, asi que funciona en las funciones de Vercel. */
const OPCIONES = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashPassword(plano: string) {
  return hash(plano, OPCIONES);
}

export async function verificarPassword(hashGuardado: string, plano: string) {
  try {
    return await verify(hashGuardado, plano, OPCIONES);
  } catch {
    return false;
  }
}
