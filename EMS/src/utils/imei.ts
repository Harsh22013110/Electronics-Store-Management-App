export function normalizeImei(raw: string) {
  return raw.trim().replace(/\s+/g, '');
}

export function parseImeiList(input: string): string[] {
  const parts = input
    .split(/[\n,;]+/g)
    .map((s) => normalizeImei(s))
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}

