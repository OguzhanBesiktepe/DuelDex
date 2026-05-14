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
  // Hardcoded hex values — CSS custom properties (var(--...)) are not supported in email clients
  const priceColor = isUp ? "#16a34a" : "#dc2626";
  const badgeBg = isUp ? "#dcfce7" : "#fee2e2";
  const badgeBorder = isUp ? "#86efac" : "#fca5a5";
  const absPct = Math.abs(pctChange).toFixed(1);
  const diff = Math.abs(newPrice - oldPrice).toFixed(2);
  const cardUrl = `${APP_URL}/${game === "yugioh" ? "yugioh" : "pokemon"}/card/${cardId}`;
  const alertsUrl = `${APP_URL}/alerts`;
  const subject = `DuelDex Alert: ${cardName} ${arrow}${absPct}% (${symbol}${oldPrice.toFixed(2)} → ${symbol}${newPrice.toFixed(2)})`;

  // Light background email — Gmail web dark mode and Gmail mobile both handle light
  // backgrounds correctly; dark backgrounds get unpredictably inverted on mobile.
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;"><tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:32px 16px;">
<tr><td>

<!-- Header -->
<div style="text-align:center;margin-bottom:24px;">
  <img src="${APP_URL}/Logo.png" alt="DuelDex" width="140" style="display:inline-block;height:auto;" />
  <p style="margin:8px 0 0;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;">Price Alert</p>
</div>

<!-- Card panel -->
<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:20px;margin-bottom:20px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width:72px;vertical-align:top;padding-right:14px;">
        <img src="${cardImage}" alt="${cardName}" width="72" style="border-radius:6px;display:block;" />
      </td>
      <td style="vertical-align:top;">
        <p style="margin:0 0 3px;font-size:17px;font-weight:700;color:#111827;">${cardName}</p>
        <p style="margin:0 0 14px;font-size:11px;color:#6b7280;">${setCode || (game === "yugioh" ? "Yu-Gi-Oh!" : "Pokémon")}</p>
        <div style="margin-bottom:10px;">
          <span style="font-size:26px;font-weight:900;color:${priceColor};">${symbol}${newPrice.toFixed(2)}</span>
          <span style="font-size:13px;color:#9ca3af;text-decoration:line-through;margin-left:8px;">${symbol}${oldPrice.toFixed(2)}</span>
        </div>
        <span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${badgeBg};border:1px solid ${badgeBorder};font-size:12px;font-weight:700;color:${priceColor};">
          ${arrow} ${absPct}% &nbsp;(${symbol}${diff})
        </span>
      </td>
    </tr>
  </table>
</div>

<!-- CTA -->
<div style="text-align:center;margin-bottom:24px;">
  <a href="${cardUrl}" style="display:inline-block;padding:13px 28px;background:#FF7A00;color:#ffffff;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none;">
    View Card on DuelDex
  </a>
</div>

<!-- Footer -->
<div style="text-align:center;border-top:1px solid #e5e7eb;padding-top:18px;">
  <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">
    Manage alerts at <a href="${alertsUrl}" style="color:#FF7A00;text-decoration:none;">DuelDex Alerts</a>
  </p>
  <p style="margin:0;font-size:11px;color:#9ca3af;">
    You received this because you have a price alert on DuelDex.<br>
    To stop receiving these, <a href="${alertsUrl}" style="color:#9ca3af;">disable or delete the alert</a>.
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
