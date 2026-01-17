export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  try {
    const {
      name, phone, email, city, message,
      projectType, budget, dimensions, sourceUrl,
      company
    } = req.body || {};

    if (company && String(company).trim() !== "") return res.status(200).json({ ok: true });

    if (!name || !message || (!phone && !email)) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      return res.status(500).json({ ok: false, error: "Missing env vars" });
    }

    const text =
      `🧾 LEAD NOU — RUJ\n\n` +
      `👤 Nume: ${name}\n` +
      `📞 Telefon: ${phone || "-"}\n` +
      `📧 Email: ${email || "-"}\n` +
      `📍 Oraș: ${city || "-"}\n` +
      `🏷️ Tip proiect: ${projectType || "-"}\n` +
      `💰 Buget: ${budget || "-"}\n` +
      `📐 Dimensiuni: ${dimensions || "-"}\n` +
      `🔗 Sursă: ${sourceUrl || "-"}\n\n` +
      `💬 Mesaj:\n${message}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text })
    });

    if (!tgRes.ok) return res.status(500).json({ ok: false, error: await tgRes.text() });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
