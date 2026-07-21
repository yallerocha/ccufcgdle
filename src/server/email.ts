import { getEmailFrom, getMailTransport } from './mail-transport';

function appBaseUrl(): string {
  const url = process.env.APP_URL || process.env.CORS_ORIGIN?.split(',')[0]?.trim();
  if (url) return url.replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3003';
  throw new Error('APP_URL is not defined.');
}

async function sendHtmlEmail(
  to: string,
  subject: string,
  html: string,
  devLabel: string,
  link: string,
): Promise<void> {
  const transport = getMailTransport();

  if (transport) {
    try {
      await transport.sendMail({
        from: getEmailFrom(),
        to,
        subject,
        html,
      });
      return;
    } catch (err) {
      console.error('[email] SMTP error:', err);
      throw new Error('Falha ao enviar email.');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[email] ${devLabel} for ${to}: ${link}`);
    return;
  }

  throw new Error('SMTP is not configured (set SMTP_HOST or SMTP_URL).');
}

function verificationEmailHtml(name: string, link: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
      <h1 style="font-size: 1.25rem; color: #4562c1;">O Show da Computação</h1>
      <p>Olá, <strong>${escapeHtml(name)}</strong>!</p>
      <p>Confirme seu email para ativar sua conta no O Show da Computação:</p>
      <p style="margin: 1.5rem 0;">
        <a href="${link}" style="background: #4562c1; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Confirmar email
        </a>
      </p>
      <p style="font-size: 0.875rem; color: #64748b;">
        Se o botão não funcionar, copie e cole este link no navegador:<br />
        <a href="${link}">${link}</a>
      </p>
      <p style="font-size: 0.875rem; color: #64748b;">Este link expira em 24 horas.</p>
    </div>
  `.trim();
}

function passwordResetEmailHtml(name: string, link: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
      <h1 style="font-size: 1.25rem; color: #4562c1;">O Show da Computação</h1>
      <p>Olá, <strong>${escapeHtml(name)}</strong>!</p>
      <p>Recebemos um pedido para redefinir a senha da sua conta. Se foi você, clique no botão abaixo:</p>
      <p style="margin: 1.5rem 0;">
        <a href="${link}" style="background: #4562c1; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Redefinir senha
        </a>
      </p>
      <p style="font-size: 0.875rem; color: #64748b;">
        Se o botão não funcionar, copie e cole este link no navegador:<br />
        <a href="${link}">${link}</a>
      </p>
      <p style="font-size: 0.875rem; color: #64748b;">Este link expira em 1 hora. Se você não pediu a redefinição, ignore este email.</p>
    </div>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${appBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await sendHtmlEmail(
    to,
    'Confirme seu email — O Show da Computação',
    verificationEmailHtml(name, link),
    'Verification link',
    link,
  );
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendHtmlEmail(
    to,
    'Redefinir senha — O Show da Computação',
    passwordResetEmailHtml(name, link),
    'Password reset link',
    link,
  );
}
