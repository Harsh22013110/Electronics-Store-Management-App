import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import type { ReceiptContext } from '../types';
import { formatMoney } from '../utils/money';

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return c;
    }
  });
}

export function receiptHtml(ctx: ReceiptContext) {
  const t = ctx.transaction;
  const date = format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm');
  const title = t.type === 'purchase' ? 'Purchase Receipt' : 'Sales Receipt';
  const personLabel = t.type === 'purchase' ? 'Supplier' : 'Customer';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; }
      .top { display: flex; justify-content: space-between; gap: 12px; }
      h1 { font-size: 20px; margin: 0; }
      .muted { color: #555; font-size: 12px; }
      .card { border: 1px solid #eee; border-radius: 12px; padding: 16px; margin-top: 16px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #eee; font-size: 13px; }
      .right { text-align: right; }
      .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; }
      .paid { background: #dcfce7; color: #166534; }
      .pending { background: #fee2e2; color: #991b1b; }
      .imei { font-size: 11px; word-break: break-all; }
    </style>
  </head>
  <body>
    <div class="top">
      <div>
        <h1>${escapeHtml(ctx.shopName)}</h1>
        <div class="muted">${escapeHtml(title)}</div>
      </div>
      <div class="muted">
        <div><b>Date</b>: ${escapeHtml(date)}</div>
        <div><b>Receipt</b>: ${escapeHtml(t.id)}</div>
      </div>
    </div>

    <div class="card">
      <div><b>${escapeHtml(personLabel)}</b>: ${escapeHtml(t.personName)}</div>
      <div class="muted">${escapeHtml(t.companyName)} · ${escapeHtml(t.modelName)}</div>

      <table>
        <thead>
          <tr>
            <th>Qty</th>
            <th>Unit Price</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${t.quantity}</td>
            <td>${escapeHtml(formatMoney(t.unitPrice))}</td>
            <td class="right"><b>${escapeHtml(formatMoney(t.totalPrice))}</b></td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 12px;">
        <span class="pill ${t.paymentStatus === 'paid' ? 'paid' : 'pending'}">
          ${escapeHtml(t.paymentStatus.toUpperCase())}
        </span>
      </div>

      <div style="margin-top: 12px;" class="imei">
        <b>IMEI</b>: ${escapeHtml(t.imeis.join(', '))}
      </div>
    </div>
  </body>
</html>`;
}

export async function shareReceiptPdf(ctx: ReceiptContext) {
  const html = receiptHtml(ctx);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  // `printToFileAsync` already returns a shareable local file URI.
  await Sharing.shareAsync(uri);
}

export async function printReceipt(ctx: ReceiptContext) {
  const html = receiptHtml(ctx);
  await Print.printAsync({ html });
}

