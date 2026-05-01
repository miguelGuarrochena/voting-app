// ------------------------------------------------------------
//  Ratings — helpers compartidos.
//
//  Hay 2 conceptos clave:
//
//    1) RatingAttribute (criterios) → cada rating se puede puntuar
//       sobre 1 o N criterios definidos por el creador
//       (ej: "Servicio", "Comida", "Tiempo de espera"). Cada
//       attribute tiene id estable + label.
//
//    2) RatingValue (las estrellas) → cada participante manda
//       ratings = { [optionId]: { [attributeId]: stars } }
//
//  Compat hacia atrás: ratings creados antes de esta refactor
//  no tenían attributes. Los normalizamos a un único atributo
//  con id LEGACY_ATTR_ID y label "General"/"Overall". Las
//  responses viejas vienen como { [optionId]: number } y las
//  reescribimos a { [optionId]: { [LEGACY_ATTR_ID]: number } }.
// ------------------------------------------------------------

export const LEGACY_ATTR_ID = '__overall__';

export type RatingAttribute = {
  id: string;
  label: string;
};

export type RatingMap = Record<string, Record<string, number>>; // optId -> attrId -> stars

export type RatingOptionAggregate = {
  // suma total y count GLOBAL (across attributes) — útil para podio.
  totalRating: number;
  ratingCount: number;
  // por-atributo: total y count → permite calcular promedio por criterio.
  byAttr: Record<string, { total: number; count: number }>;
};

/**
 * Lee la lista de attributes embebida en `options[0].attributes`.
 * Si no hay (poll legacy o sin attributes definidos) devuelve un
 * único attribute "General" con LEGACY_ATTR_ID.
 */
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

/**
 * Normaliza el value de una response.
 * Acepta:
 *   - number (formato legacy single-rating)         → { __overall__: n }
 *   - object { [attrId]: number } (nuevo)           → tal cual
 */
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

/**
 * Recomputa los agregados de cada option a partir de las responses.
 * Devuelve un nuevo array de options con totalRating, ratingCount y byAttr.
 */
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

/**
 * Promedio overall de una option (suma total / count total).
 * Si no hay ratings devuelve 0.
 */
export function avgOverall(option: any): number {
  const c = Number(option?.ratingCount) || 0;
  if (c <= 0) return 0;
  const t = Number(option?.totalRating) || 0;
  return t / c;
}

/**
 * Promedio de una option en un attribute específico.
 */
export function avgForAttr(option: any, attrId: string): number {
  const a = option?.byAttr?.[attrId];
  if (!a || !a.count) return 0;
  return a.total / a.count;
}

/**
 * Genera un id estable para un attribute (no usar UUID muy largo en JSON).
 */
export function newAttrId(): string {
  // 8 chars hex es más que suficiente para 1 poll
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint8Array(4);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Adjunta los attributes a CADA option (redundante pero sirve para
 * que cualquier consumidor que sólo lea options[i] tenga el contexto
 * de qué criterios existen). El UI siempre lee options[0].attributes.
 */
export function attachAttributesToOptions(
  options: any[],
  attributes: RatingAttribute[]
): any[] {
  const cleanAttrs = (attributes ?? [])
    .map((a) => ({ id: a.id, label: (a.label ?? '').trim() }))
    .filter((a) => a.id && a.label);
  return (options ?? []).map((o) => ({ ...o, attributes: cleanAttrs }));
}
