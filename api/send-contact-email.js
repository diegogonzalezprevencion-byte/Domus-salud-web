const nodemailer = require('nodemailer');

const CONTACT_TO = process.env.CONTACT_TO || 'contacto@domusalud.cl';
const CONTACT_FROM = process.env.CONTACT_FROM || process.env.SMTP_USER || 'contacto@domusalud.cl';
const SMTP_HOST = process.env.SMTP_HOST || 'mail.domusalud.cl';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || (SMTP_PORT === 465 ? 'true' : 'false')).toLowerCase() === 'true';

function clean(value) {
  return String(value || '').trim().slice(0, 2000);
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildText(data) {
  return [
    'Nueva solicitud de evaluación - Domus Salud',
    '',
    `Nombre: ${clean(data.name) || 'No indicado'}`,
    `Teléfono: ${clean(data.phone) || 'No indicado'}`,
    `Correo: ${clean(data.email) || 'No indicado'}`,
    `Servicio requerido: ${clean(data.service) || 'No indicado'}`,
    `Región: ${clean(data.region) || 'No indicada'}`,
    `Comuna: ${clean(data.commune) || 'No indicada'}`,
    '',
    'Mensaje:',
    clean(data.message) || 'No indicado',
    '',
    `Fecha de recepción: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`
  ].join('\n');
}

function buildHtml(data) {
  return `
    <div style="font-family:Arial,sans-serif;color:#172334;line-height:1.5;max-width:720px">
      <div style="background:#003A78;color:#fff;padding:18px 22px;border-radius:18px 18px 0 0">
        <h1 style="font-size:22px;margin:0">Nueva solicitud de evaluación</h1>
        <p style="margin:6px 0 0;color:#DDEBFF">Domus Salud</p>
      </div>
      <div style="border:1px solid #D9E5E5;border-top:0;padding:20px 22px;border-radius:0 0 18px 18px;background:#fff">
        <p><strong>Nombre:</strong> ${escapeHtml(data.name) || 'No indicado'}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(data.phone) || 'No indicado'}</p>
        <p><strong>Correo:</strong> ${escapeHtml(data.email) || 'No indicado'}</p>
        <p><strong>Servicio requerido:</strong> ${escapeHtml(data.service) || 'No indicado'}</p>
        <p><strong>Región:</strong> ${escapeHtml(data.region) || 'No indicada'}</p>
        <p><strong>Comuna:</strong> ${escapeHtml(data.commune) || 'No indicada'}</p>
        <hr style="border:0;border-top:1px solid #D9E5E5;margin:18px 0" />
        <p><strong>Mensaje:</strong></p>
        <p style="white-space:pre-wrap;background:#F6F9F7;border:1px solid #D9E5E5;border-radius:14px;padding:14px">${escapeHtml(data.message) || 'No indicado'}</p>
        <p style="color:#667085;font-size:13px;margin-top:18px">Fecha de recepción: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}</p>
      </div>
    </div>
  `;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, message: 'Método no permitido' });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(503).json({
      ok: false,
      message: 'Faltan variables SMTP_USER y SMTP_PASS en Vercel.'
    });
  }

  try {
    const data = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `Domus Salud <${CONTACT_FROM}>`,
      to: CONTACT_TO,
      replyTo: clean(data.email) || CONTACT_FROM,
      subject: `Nueva solicitud Domus Salud - ${clean(data.name) || 'Sin nombre'}`,
      text: buildText(data),
      html: buildHtml(data)
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error al enviar correo de contacto:', error);
    return res.status(500).json({
      ok: false,
      message: 'No se pudo enviar el correo automático.',
      detail: error.message
    });
  }
};
