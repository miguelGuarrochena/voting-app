// Helpers for ratings that use multiple criteria (e.g. "Service", "Food").
// Each response sends stars keyed by (optionId, attributeId). For old polls
// without attributes, we fall back to LEGACY_ATTR_ID.

export const LEGACY_ATTR_ID = '__overall__';

export type RatingAttribute = {
  id: string;
  label: string;
};

export type RatingMap = Record<string, Record<string, number>>; // optId -> attrId -> stars

export type RatingOptionAggregate = {
  totalRating: number;
  ratingCount: number;
  byAttr: Record<string, { total: number; count: number }>;
};

// Read the attributes list from options[0]. If there isn't one, return a
// single attribute with LEGACY_ATTR_ID so old polls keep working.
export function getAttributesFromPoll(
  pollData: any,
  fallbackLabel = 'Overall'
): RatingAttribute[] {
  const raw = pollData?.options?.[0]?.attributes;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .filter((a: any) => a && typeof a === 'object' && a.id && a.label)
      .map((a: any) => ({ id: String(a.id), label: String(a.label) }));
  }
  return [{ id: LEGACY_ATTR_ID, label: fallbackLabel }];
}

// Accepts the old shape (number) or the new one ({ [attrId]: number }).
export function normalizeRatingValue(
  raw: unknown
): Record<string, number> {
  if (raw == null) return {};
  if (typeof raw === 'number') {
    if (Number.isFinite(raw)) return { [LEGACY_ATTR_ID]: raw };
    return {};
  }
  if (typeof raw === 'object') {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const num = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(num)) out[k] = num;
    }
    return out;
  }
  return {};
}

export function recomputeRatings(options: any[], responses: any[]) {
  const aggregates: Record<string, RatingOptionAggregate> = {};

  for (const r of responses ?? []) {
    const map = r?.response?.ratings;
    if (!map || typeof map !== 'object') continue;
    for (const [optId, raw] of Object.entries(map)) {
      const norm = normalizeRatingValue(raw);
      if (!aggregates[optId]) {
        aggregates[optId] = { totalRating: 0, ratingCount: 0, byAttr: {} };
      }
      const agg = aggregates[optId];
      for (const [attrId, stars] of Object.entries(norm)) {
        if (!Number.isFinite(stars) || stars <= 0) continue;
        if (!agg.byAttr[attrId]) agg.byAttr[attrId] = { total: 0, count: 0 };
        agg.byAttr[attrId].total += stars;
        agg.byAttr[attrId].count += 1;
        agg.totalRating += stars;
        agg.ratingCount += 1;
      }
    }
  }

  return (options ?? []).map((opt: any) => {
    const a = aggregates[opt.id] ?? {
      totalRating: 0,
      ratingCount: 0,
      byAttr: {},
    };
    return {
      ...opt,
      totalRating: a.totalRating,
      ratingCount: a.ratingCount,
      byAttr: a.byAttr,
    };
  });
}

export function avgOverall(option: any): number {
  const c = Number(option?.ratingCount) || 0;
  if (c <= 0) return 0;
  const t = Number(option?.totalRating) || 0;
  return t / c;
}

export function avgForAttr(option: any, attrId: string): number {
  const a = option?.byAttr?.[attrId];
  if (!a || !a.count) return 0;
  return a.total / a.count;
}

export function newAttrId(): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint8Array(4);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2, 10);
}

// Attach attributes to every option (redundant, but it means any consumer
// that only reads options[i] still has the context). The UI always reads
// from options[0].
export function attachAttributesToOptions(
  options: any[],
  attributes: RatingAttribute[]
): any[] {
  const cleanAttrs = (attributes ?? [])
    .map((a) => ({ id: a.id, label: (a.label ?? '').trim() }))
    .filter((a) => a.id && a.label);
  return (options ?? []).map((o) => ({ ...o, attributes: cleanAttrs }));
}
