/**
 * Mongo efimero para desarrollo local.
 *
 * Prisma necesita un replica set (no un mongod suelto) para las
 * transacciones, asi que se levanta uno de un solo nodo. Los datos viven en
 * .mongo-local/ y sobreviven entre reinicios.
 *
 * En produccion esto no se usa: ahi va la cadena de MongoDB Atlas.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const RUTA_DATOS = ".mongo-local";
const PUERTO = Number(process.env.MONGO_PUERTO ?? 27017);

async function main() {
  mkdirSync(RUTA_DATOS, { recursive: true });

  const repl = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger", name: "rs0" },
    instanceOpts: [{ port: PUERTO, dbPath: RUTA_DATOS, storageEngine: "wiredTiger" }],
  });

  const uri = repl.getUri("anuies_stem");
  writeFileSync(`${RUTA_DATOS}/uri.txt`, uri);

  console.log("\nMongoDB local listo.");
  console.log(`  DATABASE_URL="${uri}"\n`);
  console.log("Dejalo corriendo en esta terminal. Ctrl+C para detenerlo.");

  const cerrar = async () => {
    await repl.stop();
    process.exit(0);
  };
  process.on("SIGINT", cerrar);
  process.on("SIGTERM", cerrar);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
