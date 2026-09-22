const nodemailer = require('nodemailer');

const CONTACT_FROM = process.env.CONTACT_FROM || process.env.SMTP_USER || 'contacto@domusalud.cl';
const SMTP_HOST = process.env.SMTP_HOST || 'a0041362.ferozo.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || (SMTP_PORT === 465 ? 'true' : 'false')).toLowerCase() === 'true';

function clean(value, limit = 2000) {
  return String(value || '').trim().slice(0, limit);
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, message: 'Método no permitido' });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(503).json({ ok: false, message: 'Faltan variables SMTP_USER y SMTP_PASS en Vercel.' });
  }

  try {
    const data = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const to = clean(data.to, 320);
    const patientName = clean(data.patientName, 180) || 'paciente';
    const link = clean(data.link, 3000);

    if (!isValidEmail(to) || !link) {
      return res.status(400).json({ ok: false, message: 'Correo o enlace inválido.' });
    }

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
      to,
      replyTo: CONTACT_FROM,
      subject: 'Formulario previo de antecedentes - Domus Salud',
      text: [
        `Hola ${patientName},`,
        '',
        'Domus Salud solicita completar el siguiente formulario de antecedentes básicos antes del inicio del servicio:',
        link,
        '',
        'Esta información permitirá preparar mejor la atención domiciliaria.',
        '',
        'Saludos,',
        'Equipo Domus Salud'
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;color:#172334;line-height:1.55;max-width:720px">
          <div style="background:#003A78;color:#fff;padding:18px 22px;border-radius:18px 18px 0 0">
            <h1 style="font-size:22px;margin:0">Formulario previo de antecedentes</h1>
            <p style="margin:6px 0 0;color:#DDEBFF">Domus Salud</p>
          </div>
          <div style="border:1px solid #D9E5E5;border-top:0;padding:20px 22px;border-radius:0 0 18px 18px;background:#fff">
            <p>Hola <strong>${escapeHtml(patientName)}</strong>,</p>
            <p>Para preparar mejor tu atención domiciliaria, te solicitamos completar el siguiente formulario de antecedentes básicos antes del inicio del servicio.</p>
            <p style="margin:24px 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#003A78;color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:12px 18px">Completar formulario</a></p>
            <p style="font-size:13px;color:#667085">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${escapeHtml(link)}</p>
          </div>
        </div>
      `
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error al enviar formulario previo al paciente:', error);
    return res.status(500).json({ ok: false, message: 'No se pudo enviar el formulario al paciente.', detail: error.message });
  }
};
