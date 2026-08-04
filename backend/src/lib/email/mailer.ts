import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../../config/env";

let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
  transporterPromise ??= (async () => {
    if (env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      });
    }
    const testAccount = await nodemailer.createTestAccount();
    console.log(`No SMTP configured — using Ethereal test account: ${testAccount.user}`);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();
  return transporterPromise;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({ from: env.SMTP_FROM, ...options });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log(`Email preview: ${previewUrl}`);
  return info;
}
