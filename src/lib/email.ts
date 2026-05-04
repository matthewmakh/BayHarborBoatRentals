// Mail provider abstraction. Configure via EMAIL_PROVIDER env var.
// Supported: resend | sendgrid | smtp | console (default).

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

const FROM = process.env.EMAIL_FROM || "Bay Harbor Boat Rentals <noreply@bayharborboatrentals.com>";

async function sendViaResend(args: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY missing");
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: FROM,
    to: Array.isArray(args.to) ? args.to : [args.to],
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (result.error) throw new Error(`Resend error: ${result.error.message}`);
}

async function sendViaSendgrid(args: SendArgs) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY missing");
  const recipients = (Array.isArray(args.to) ? args.to : [args.to]).map((email) => ({ email }));
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: recipients }],
      from: { email: FROM.match(/<(.+)>/)?.[1] ?? FROM, name: FROM.replace(/<.+>/, "").trim() },
      subject: args.subject,
      content: [
        { type: "text/plain", value: args.text || stripHtml(args.html) },
        { type: "text/html", value: args.html },
      ],
    }),
  });
  if (!res.ok) throw new Error(`SendGrid error: ${res.status} ${await res.text()}`);
}

async function sendViaSmtp(args: SendArgs) {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  await transporter.sendMail({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function sendEmail(args: SendArgs): Promise<void> {
  const provider = (process.env.EMAIL_PROVIDER || "console").toLowerCase();
  try {
    switch (provider) {
      case "resend":
        await sendViaResend(args);
        return;
      case "sendgrid":
        await sendViaSendgrid(args);
        return;
      case "smtp":
        await sendViaSmtp(args);
        return;
      default:
        // eslint-disable-next-line no-console
        console.log("[email:console]", { to: args.to, subject: args.subject, text: args.text || stripHtml(args.html) });
        return;
    }
  } catch (err) {
    // Never let mail failures break the request lifecycle.
    // eslint-disable-next-line no-console
    console.error("[email] send failed:", err);
  }
}

export function notificationRecipient(): string {
  return process.env.NOTIFICATION_EMAIL || "daniel@bayharborboatrentals.com";
}

export function wrapHtml(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f5f7fa;padding:24px;color:#0a2236;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e2e8f0;">
      <h1 style="color:#1f4e79;margin:0 0 16px;font-size:20px;">${title}</h1>
      ${bodyHtml}
      <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0"/>
      <p style="font-size:12px;color:#64748b">Bay Harbor Boat Rentals · 9901 E Bay Harbor Drive, Bay Harbor Islands, FL 33154 · 516-974-8874</p>
    </div></body></html>`;
}
