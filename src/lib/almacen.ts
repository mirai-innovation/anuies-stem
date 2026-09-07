import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

/** Almacenamiento en S3.
 *
 *  Nada es público: se sube con una URL firmada de escritura y se lee con una
 *  URL firmada de lectura que caduca en minutos. El objeto nunca pasa por el
 *  servidor de la app —un video de 500 MB atravesando una función serverless
 *  no cabe en ningún límite de cuerpo— pero el servidor sí verifica el objeto
 *  ya subido antes de registrarlo. */

const REGION = process.env.AWS_REGION ?? "ap-southeast-2";
const BUCKET = process.env.AWS_BUCKET_NAME ?? "";
const PREFIJO = process.env.S3_PREFIJO ?? "anuies-stem/2026";
const MINUTOS_LECTURA = Number(process.env.S3_URL_MINUTOS ?? 5);

const global_ = globalThis as unknown as { s3?: S3Client };

export function s3() {
  global_.s3 ??= new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });
  return global_.s3;
}

export function almacenConfigurado() {
  return Boolean(BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

/** La llave lleva el folio, así que los objetos de una aplicación quedan
 *  juntos y son rastreables desde la base sin consultar S3. */
export function llave(folio: string, carpeta: "documentos" | "videos", nombre: string) {
  const limpio = nombre.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  return `${PREFIJO}/${folio}/${carpeta}/${Date.now()}-${limpio}`;
}

/** Autorización de escritura, como POST firmado con condiciones de política.
 *
 *  Se probó primero con una URL PUT firmada y resultó insuficiente: S3 acepta
 *  el PUT con cualquier Content-Type y de cualquier tamaño, porque esos
 *  valores no forman parte de la firma. Es decir, una URL firmada para un PDF
 *  de 10 MB servía igual para depositar un ejecutable de un giga.
 *
 *  El POST firmado sí lleva una política que S3 evalúa ANTES de aceptar los
 *  bytes: si el tipo no es exactamente el autorizado o el peso se sale del
 *  rango, la subida se rechaza y el archivo nunca toca el bucket. */
export function autorizacionDeSubida(
  key: string,
  contentType: string,
  maxBytes: number,
  segundos = 900,
) {
  return createPresignedPost(s3(), {
    Bucket: BUCKET,
    Key: key,
    Expires: segundos,
    Conditions: [
      ["content-length-range", 1, maxBytes],
      ["eq", "$Content-Type", contentType],
    ],
    Fields: { "Content-Type": contentType },
  });
}

export function urlDeLectura(key: string, nombreDescarga?: string) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: nombreDescarga
        ? `inline; filename="${nombreDescarga.replace(/"/g, "")}"`
        : undefined,
    }),
    { expiresIn: MINUTOS_LECTURA * 60 },
  );
}

/** Tamaño y tipo reales del objeto ya subido. Es lo que permite imponer los
 *  límites en el servidor y no confiar en lo que dijo el formulario. */
export async function metadatos(key: string) {
  const r = await s3().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  return {
    tamanoBytes: Number(r.ContentLength ?? 0),
    contentType: r.ContentType ?? "application/octet-stream",
  };
}

export async function borrar(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Lee un tramo del objeto. Sirve para inspeccionar los encabezados de un
 *  video sin descargar los 500 MB. */
export async function leerRango(key: string, inicio: number, fin: number): Promise<Buffer> {
  const r = await s3().send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key, Range: `bytes=${inicio}-${fin}` }),
  );
  const trozos: Uint8Array[] = [];
  // @ts-expect-error el Body de S3 en Node es un stream asíncrono iterable
  for await (const t of r.Body) trozos.push(t as Uint8Array);
  return Buffer.concat(trozos);
}
