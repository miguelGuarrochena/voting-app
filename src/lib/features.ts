// ------------------------------------------------------------
//  Feature flags — controladas por variables de entorno.
//
//  VERSUS está habilitado por default después del rediseño
//  (bracket/league modes, result entry, etc.).
// ------------------------------------------------------------

export const FEATURES = {
  versus: process.env.NEXT_PUBLIC_ENABLE_VERSUS !== 'false',
  ratings: process.env.NEXT_PUBLIC_ENABLE_RATINGS === 'true',
} as const;
