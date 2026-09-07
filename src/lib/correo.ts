import nodemailer from "nodemailer";

/** Correos de la convocatoria.
 *
 *  El envío nunca hace fallar la operación que lo dispara: si el SMTP está
 *  caído, la aplicante igual queda registrada y su envío igual se guarda. El
 *  fallo se registra en consola y la interfaz ofrece reenviar el enlace. */

const REMITENTE =
  process.env.CORREO_REMITENTE ?? "Reto ANUIES4MX <no-reply@anuies4mx.mx>";
const BASE = process.env.FRONTEND_URL ?? "http://localhost:3000";

function transporte() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export function correoConfigurado() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

/** Plantilla común: el diseño de la plataforma no se traslada tal cual al
 *  correo porque los clientes de correo no soportan flexbox ni fuentes
 *  externas de forma fiable. Se conserva la paleta y la jerarquía. */
function plantilla(titulo: string, cuerpo: string, boton?: { texto: string; url: string }) {
  return `<!doctype html>
<html lang="es-MX"><body style="margin:0;background:#FBF5F8;font-family:Helvetica,Arial,sans-serif;color:#26212E">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF5F8;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #EEE3EA">
        <tr><td style="background:#26212E;padding:24px 28px">
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B9AEC2">ANUIES &times; Mirai Innovation</div>
          <div style="font-size:26px;font-weight:bold;text-transform:uppercase;color:#FFFFFF;margin-top:6px">Reto ANUIES4MX <span style="color:#FF6FA5">Mujeres STEM</span></div>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 16px;font-size:20px;text-transform:uppercase;color:#26212E">${titulo}</h1>
          <div style="font-size:15px;line-height:1.65;color:#26212E">${cuerpo}</div>
          ${
            boton
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px"><tr><td style="background:#D6336C">
                   <a href="${boton.url}" style="display:inline-block;padding:14px 26px;color:#FFFFFF;text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:bold">${boton.texto}</a>
                 </td></tr></table>
                 <p style="font-size:12px;color:#736C7B;line-height:1.6;margin:14px 0 0">Si el botón no funciona, copia esta dirección en tu navegador:<br><span style="color:#8A1F49;word-break:break-all">${boton.url}</span></p>`
              : ""
          }
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #EEE3EA;font-size:11px;color:#736C7B;line-height:1.6">
          Este mensaje se envió de forma automática. Tus datos se tratan conforme al aviso de privacidad de la convocatoria.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function enviar(para: string, asunto: string, html: string) {
  const t = transporte();
  if (!t) {
    console.warn(`[correo] sin configurar; no se envió "${asunto}" a ${para}`);
    return false;
  }
  try {
    await t.sendMail({ from: REMITENTE, to: para, subject: asunto, html });
    return true;
  } catch (e) {
    console.error(`[correo] falló el envío de "${asunto}" a ${para}:`, e);
    return false;
  }
}

export function correoVerificacion(para: string, nombre: string, token: string) {
  return enviar(
    para,
    "Confirma tu correo · Reto ANUIES4MX 2026",
    plantilla(
      "Confirma tu correo",
      `<p>Hola ${nombre}:</p><p>Tu cuenta quedó creada. Confirma tu correo para poder iniciar sesión y empezar tu postulación.</p><p>El enlace vence en 48 horas.</p>`,
      { texto: "Confirmar mi correo", url: `${BASE}/verificar?token=${token}` },
    ),
  );
}

export function correoRecuperacion(para: string, nombre: string, token: string) {
  return enviar(
    para,
    "Restablece tu contraseña · Reto ANUIES4MX 2026",
    plantilla(
      "Restablece tu contraseña",
      `<p>Hola ${nombre}:</p><p>Recibimos una solicitud para cambiar tu contraseña. Si no fuiste tú, ignora este mensaje: tu contraseña actual sigue vigente.</p><p>El enlace vence en una hora.</p>`,
      { texto: "Cambiar mi contraseña", url: `${BASE}/recuperar/${token}` },
    ),
  );
}

export function correoEnvioRecibido(para: string, nombre: string, folio: string, cierre: string) {
  return enviar(
    para,
    `Recibimos tu aplicación · ${folio}`,
    plantilla(
      "Recibimos tu aplicación",
      `<p>Hola ${nombre}:</p><p>Tu aplicación quedó registrada con el folio <strong>${folio}</strong>. A partir de este momento no puede editarse.</p>
       <p>El periodo de recepción cierra el ${cierre}. Después viene la evaluación del comité y la publicación de resultados.</p>`,
      { texto: "Ver mi convocatoria", url: `${BASE}/dashboard` },
    ),
  );
}

export function correoResultados(para: string, nombre: string, folio: string) {
  return enviar(
    para,
    `Ya puedes consultar tu resultado · ${folio}`,
    plantilla(
      "Resultados publicados",
      `<p>Hola ${nombre}:</p><p>El comité publicó los dictámenes de la convocatoria. Entra a la plataforma para ver tu puntaje por criterio y la retroalimentación.</p>`,
      { texto: "Ver mi resultado", url: `${BASE}/resultado` },
    ),
  );
}

export function correoRecordatorioConfirmacion(
  para: string,
  nombre: string,
  cierra: string,
) {
  return enviar(
    para,
    "Confirma tu participación · Reto ANUIES4MX 2026",
    plantilla(
      "Confirma tu lugar",
      `<p>Hola ${nombre}:</p><p>Fuiste seleccionada para el Reto ANUIES4MX 2026. Para conservar tu lugar necesitas confirmar tu participación y llenar tus datos logísticos <strong>antes del ${cierra}</strong>.</p>`,
      { texto: "Confirmar mi participación", url: `${BASE}/confirmacion` },
    ),
  );
}
