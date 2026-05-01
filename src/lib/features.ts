// ------------------------------------------------------------
//  Feature flags — controladas por variables de entorno.
//
//  VERSUS y RATINGS están habilitados por default después de
//  sus rediseños (bracket/league modes para versus; criterios
//  dinámicos + multi-attribute scoring para ratings).
//  Se pueden apagar pasando NEXT_PUBLIC_ENABLE_*=false.
// ------------------------------------------------------------

export const FEATURES = {
  versus: process.env.NEXT_PUBLIC_ENABLE_VERSUS !== 'false',
  ratings: process.env.NEXT_PUBLIC_ENABLE_RATINGS !== 'false',
} as const;
