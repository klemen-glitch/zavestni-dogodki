/**
 * Thin email utility using the Resend API.
 * Set RESEND_API_KEY and (optionally) EMAIL_FROM in your environment.
 * If RESEND_API_KEY is not set the call is a no-op — safe for local dev.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from =
    process.env.EMAIL_FROM ?? "Zavestni Dogodki <noreply@zavestnidogodki.si>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Reusable approval email HTML. */
export function approvalEmailHtml(titleEn: string, eventUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="sl">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#f5f5f4;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4;">
    <div style="background:#2d6a4f;padding:32px 32px 24px;">
      <p style="color:#d8f3dc;margin:0;font-size:14px;">Zavestni Dogodki</p>
      <h1 style="color:#fff;font-size:24px;margin:8px 0 0;">Vaš dogodek je odobren! 🌿</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#44403c;font-size:15px;line-height:1.6;">
        Veselimo se sporočiti, da je bil vaš dogodek <strong>${titleEn}</strong>
        pregledan in odobren. Zdaj je viden vsem obiskovalcem platforme.
      </p>
      <a href="${eventUrl}" style="display:inline-block;margin:20px 0;background:#2d6a4f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;font-size:14px;">
        Oglej si objavo →
      </a>
      <p style="color:#78716c;font-size:13px;line-height:1.6;margin-top:24px;border-top:1px solid #e7e5e4;padding-top:20px;">
        Hvala, ker delite zavestne dogodke z Slovenijo. 🙏<br>
        Ekipa Zavestni Dogodki
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}
