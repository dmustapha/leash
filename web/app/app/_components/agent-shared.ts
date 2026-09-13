// File: web/app/app/_components/agent-shared.ts
// Shared conversions + plain-language labels for the fleet card, agent controls, and detail page. Keeps the
// user-facing wording ("Up to $5 per payment", "Active 09:00 to 17:00 UTC") in one place so it stays consistent.

// USDC (6 decimals) raw smallest-unit -> "$5" style display (dollars).
export function usdDollars(raw: string): string {
  const n = Number(raw) / 1_000_000;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// USDC display string -> raw smallest-unit string. "5" -> "5000000". null if invalid.
export function toRaw(v: string): string | null {
  if (!/^\d+(\.\d{1,6})?$/.test(v.trim())) return null;
  const [w, f = ''] = v.trim().split('.');
  return (BigInt(w) * 1_000_000n + BigInt(f.padEnd(6, '0'))).toString();
}

// "HH:MM" (UTC) -> minute-of-day 0..1439, or null.
export function toMinute(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function fromMinute(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export type TimeWindow = { startMinuteUtc: number; endMinuteUtc: number; days?: number[] };
export type LivePolicy = { maxPerCall: string; allowedPayees: string[]; dailyCap?: string; weeklyCap?: string; allowedWindows?: TimeWindow[] } | null;
export type SpendRow = { id: string; agentName: string; decision: string; amount: string; payTo: string; reason: string | null; ts: string };

// Plain-language remaining-window hint for the first window entry (off the current UTC minute-of-day).
export function windowLabel(windows: TimeWindow[] | undefined): { text: string; open: boolean | null } {
  if (!windows || windows.length === 0) return { text: 'Any time of day', open: null };
  const w = windows[0];
  const now = new Date();
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const range = `${fromMinute(w.startMinuteUtc)} to ${fromMinute(w.endMinuteUtc)} UTC`;
  const inside = nowMin >= w.startMinuteUtc && nowMin < w.endMinuteUtc;
  if (inside) {
    const mins = w.endMinuteUtc - nowMin;
    return { text: `Active ${range} · open, ${Math.floor(mins / 60)}h ${mins % 60}m left`, open: true };
  }
  return { text: `Active ${range} · closed now`, open: false };
}

// The URL slug for an agent's detail route: the label before the first dot of its ENS name.
export function agentSlug(ensName: string): string {
  return ensName.split('.')[0];
}

// Short outcome text for a spend decision, plain language.
export function outcomeLabel(row: { decision: string; reason: string | null }): string {
  if (row.decision === 'ALLOW') return 'Paid';
  return row.reason ? `Blocked · ${humanReason(row.reason)}` : 'Blocked';
}

// Map known machine reasons to friendlier phrasing; fall back to the raw reason otherwise.
export function humanReason(reason: string): string {
  const r = reason.toLowerCase();
  if (r.includes('daily')) return 'over daily limit';
  if (r.includes('weekly')) return 'over weekly limit';
  if (r.includes('cap') || r.includes('percall') || r.includes('per-call')) return 'over per-payment limit';
  if (r.includes('window') || r.includes('time')) return 'outside allowed hours';
  if (r.includes('payee') || r.includes('allow')) return 'payee not allowed';
  if (r.includes('revok')) return 'agent revoked';
  return reason;
}
