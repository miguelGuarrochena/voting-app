// ------------------------------------------------------------
//  Feature flags — controladas por variables de entorno.
//
//  VERSUS está deshabilitado por default mientras re-diseñamos
//  el modo "Dirección B" (hybrid personal + aggregated). Para
//  habilitarlo localmente poner en .env.local:
//
//    NEXT_PUBLIC_ENABLE_VERSUS=true
//
//  Mientras esté en false:
//    - Se ocultan links a /versus en nav y home.
//    - Las rutas /versus, /versus/create y /versus/[token] muestran
//      un mensaje "próximamente" (ver los respectivos page.tsx).
// ------------------------------------------------------------

export const FEATURES = {
  versus: process.env.NEXT_PUBLIC_ENABLE_VERSUS === 'true',
} as const;
