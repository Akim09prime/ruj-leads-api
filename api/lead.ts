export const config = { runtime: "nodejs" };

type LeadPayload = {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  message?: string;
  projectType?: string;
};

function json(res: any, status: number, data: any) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method Not Allowed" });

  try {
    const body: LeadPayload =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { name, email, phone, city, message, projectType } = body || ({} as any);

    if (!name || !email || (!phone && !city && !message))
      return json(res, 400, { ok: false, error: "Missing fields" });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM;
    const EMAIL_TO = process.env.EMAIL_TO;

    if (!RESEND_API_KEY || !EMAIL_FROM || !EMAIL_TO) {
      return json(res, 500, { ok: false, error: "Server email not configured" });
    }

    const subject = `CARVELLO — Cerere ofertă: ${name} (${city || "-"})`;
    const text = `
Cerere nouă:
Nume: ${name}
Email: ${email}
Telefon: ${phone || "-"}
Oraș: ${city || "-"}
Tip proiect: ${projectType || "-"}
Mesaj: ${message || "-"}
`.trim();

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [EMAIL_TO],
        subject,
        text,
        reply_to: email,
      }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) return json(res, 500, { ok: false, error: "Resend error", details: data });

    return json(res, 200, { ok: true });
  } catch (err: any) {
    return json(res, 500, { ok: false, error: "Server error", details: String(err?.message || err) });
  }
}
