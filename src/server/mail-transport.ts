import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let cachedTransport: Transporter | null | undefined;

/** True when SMTP is configured (or dev console fallback is allowed). */
export function isSmtpConfigured(): boolean {
  if (process.env.SMTP_URL?.trim()) return true;
  if (process.env.SMTP_HOST?.trim()) return true;
  return process.env.NODE_ENV !== 'production';
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || 'LSD Game Hub <noreply@localhost>';
}

export function getMailTransport(): Transporter | null {
  if (cachedTransport !== undefined) return cachedTransport;

  const url = process.env.SMTP_URL?.trim();
  if (url) {
    cachedTransport = nodemailer.createTransport(url);
    return cachedTransport;
  }

  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    cachedTransport = null;
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass: pass ?? '' } : undefined,
  });

  return cachedTransport;
}
