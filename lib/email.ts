const FROM =
  process.env.EMAIL_FROM ?? "Roteia <contato@roteia.com.br>";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(
  payload: EmailPayload,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[email:dev]", payload.subject, "->", payload.to);
    console.log(payload.text);
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [payload.to],
        reply_to: "contato@roteia.com.br",
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `Resend ${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao enviar e-mail." };
  }
}

export function passwordResetHtml(url: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#18181b">Redefinir senha — Roteia</h2>
      <p>Você pediu para redefinir sua senha. O link expira em 1 hora:</p>
      <p style="margin:24px 0">
        <a href="${url}" style="background:#18181b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Redefinir senha</a>
      </p>
      <p style="color:#71717a;font-size:12px">Se você não pediu, ignore este e-mail.</p>
    </div>`;
}

export function passwordResetText(url: string): string {
  return `Roteia — redefinir senha\n\nAcesse o link (válido por 1 hora): ${url}\n\nSe você não pediu, ignore este e-mail.`;
}