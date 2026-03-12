export function toNumberOrZero(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(n: number) {
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

