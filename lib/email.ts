// Server-only — do not import in client components.
// Sends price alert emails via Resend.

import { Resend } from "resend";

// Lazy-initialize so the constructor doesn't throw during Next.js build
// when RESEND_API_KEY isn't available in the build environment.
let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dueldex.app";

export interface AlertEmailPayload {
  to: string;
  cardName: string;
  cardImage: string;
  game: "yugioh" | "pokemon";
  cardId: string;
  setCode?: string;
  oldPrice: number;
  newPrice: number;
  pctChange: number; // signed — positive = up, negative = down
  currency: "USD" | "EUR";
}

export async function sendPriceAlertEmail(payload: AlertEmailPayload): Promise<boolean> {
  const { to, cardName, cardImage, game, cardId, setCode, oldPrice, newPrice, pctChange, currency } = payload;

  const symbol = currency === "EUR" ? "€" : "$";
  const isUp = pctChange >= 0;
  const arrow = isUp ? "▲" : "▼";
  const arrowColor = isUp ? "#3ecf6a" : "#CC1F1F";
  const absPct = Math.abs(pctChange).toFixed(1);
  const diff = Math.abs(newPrice - oldPrice).toFixed(2);
  const cardUrl = `${APP_URL}/${game === "yugioh" ? "yugioh" : "pokemon"}/card/${cardId}`;
  const alertsUrl = `${APP_URL}/alerts`;
  const subject = `DuelDex Alert: ${cardName} ${arrow}${absPct}% (${symbol}${oldPrice.toFixed(2)} → ${symbol}${newPrice.toFixed(2)})`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080B14;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:32px 16px;">
<tr><td>

<!-- Header -->
<div style="text-align:center;margin-bottom:28px;">
  <span style="font-size:22px;font-weight:900;color:#FF7A00;letter-spacing:3px;">DUELDEX</span>
  <p style="margin:4px 0 0;font-size:12px;color:#7A8BA8;letter-spacing:1px;">PRICE ALERT</p>
</div>

<!-- Card panel -->
<div style="background:#0E1220;border:1px solid #1A2035;border-radius:14px;padding:20px;margin-bottom:20px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width:72px;vertical-align:top;padding-right:14px;">
        <img src="${cardImage}" alt="${cardName}" width="72" style="border-radius:6px;display:block;" />
      </td>
      <td style="vertical-align:top;">
        <p style="margin:0 0 3px;font-size:17px;font-weight:700;color:#F0F2FF;">${cardName}</p>
        <p style="margin:0 0 14px;font-size:11px;color:#7A8BA8;">${setCode || (game === "yugioh" ? "Yu-Gi-Oh!" : "Pokémon")}</p>
        <div style="margin-bottom:10px;">
          <span style="font-size:26px;font-weight:900;color:${arrowColor};">${symbol}${newPrice.toFixed(2)}</span>
          <span style="font-size:13px;color:#7A8BA8;text-decoration:line-through;margin-left:8px;">${symbol}${oldPrice.toFixed(2)}</span>
        </div>
        <span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${arrowColor}22;border:1px solid ${arrowColor}44;font-size:12px;font-weight:700;color:${arrowColor};">
          ${arrow} ${absPct}% &nbsp;(${symbol}${diff})
        </span>
      </td>
    </tr>
  </table>
</div>

<!-- CTA -->
<div style="text-align:center;margin-bottom:24px;">
  <a href="${cardUrl}" style="display:inline-block;padding:13px 28px;background:#FF7A00;color:#080B14;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none;">
    View Card on DuelDex
  </a>
</div>

<!-- Footer -->
<div style="text-align:center;border-top:1px solid #1A2035;padding-top:18px;">
  <p style="margin:0 0 6px;font-size:12px;color:#7A8BA8;">
    Manage alerts at <a href="${alertsUrl}" style="color:#FF7A00;text-decoration:none;">DuelDex Alerts</a>
  </p>
  <p style="margin:0;font-size:11px;color:#3A4A60;">
    You received this because you have a price alert on DuelDex.<br>
    To stop receiving these, <a href="${alertsUrl}" style="color:#3A4A60;">disable or delete the alert</a>.
  </p>
</div>

</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  try {
    const result = await getResend().emails.send({ from: FROM, to, subject, html });
    return !result.error;
  } catch {
    return false;
  }
}
