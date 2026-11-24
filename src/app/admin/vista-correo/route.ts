import { db } from "@/lib/db";
import { exigeRol } from "@/lib/sesion";
import { contenidoCorreoResultados, correoConfigurado } from "@/lib/correo";

/** Vista previa del correo de resultados, solo para admin.
 *
 *  Muestra el correo exactamente como lo genera la publicación, armado con los
 *  datos de una aplicante real con dictamen (o de ejemplo si aún no hay), y
 *  encima una franja con el asunto y a cuántas personas se enviará. No envía
 *  nada. */
export async function GET() {
  try {
    await exigeRol("admin");
  } catch {
    return new Response("Sin permiso.", { status: 403 });
  }

  const [muestra, destinatarias] = await Promise.all([
    db.application.findFirst({
      where: { dictamen: { not: null } },
      orderBy: { folio: "asc" },
      include: { user: { select: { nombre: true, email: true } } },
    }),
    db.application.count({ where: { dictamen: { not: null } } }),
  ]);

  const nombre = muestra ? muestra.user.nombre.split(/\s+/)[0] : "María";
  const folio = muestra?.folio ?? "FOLIO-EJEMPLO";
  const para = muestra?.user.email ?? "aplicante@ejemplo.mx";
  const { asunto, html } = contenidoCorreoResultados(nombre, folio);

  const esc = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const franja = `<div style="font-family:Helvetica,Arial,sans-serif;background:#26212E;color:#fff;padding:14px 20px;font-size:13px;line-height:1.7">
  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#FF6FA5">Vista previa · no se ha enviado</div>
  <div><strong>Asunto:</strong> ${esc(asunto)}</div>
  <div><strong>Ejemplo para:</strong> ${esc(nombre)} &lt;${esc(para)}&gt; · folio ${esc(folio)}${muestra ? "" : " (datos de ejemplo)"}</div>
  <div><strong>Se enviará a:</strong> ${destinatarias} ${destinatarias === 1 ? "aplicante" : "aplicantes"} con dictamen. El nombre y el folio cambian en cada correo.</div>
  ${correoConfigurado() ? "" : `<div style="color:#FFB4CC"><strong>Atención:</strong> el SMTP no está configurado (EMAIL_USER / EMAIL_PASS); al publicar no saldrá ningún correo.</div>`}
</div>`;

  return new Response(html.replace(/<body([^>]*)>/, `<body$1>${franja}`), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
