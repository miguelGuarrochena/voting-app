// ------------------------------------------------------------
//  Feature flags — controlled by environment variables.
//
//  VERSUS and RATINGS are enabled by default after
//  their redesigns (bracket/league modes for versus; dynamic criteria
//  + multi-attribute scoring for ratings).
//  Can be disabled by setting NEXT_PUBLIC_ENABLE_*=false.
// ------------------------------------------------------------

export const FEATURES = {
  versus: process.env.NEXT_PUBLIC_ENABLE_VERSUS !== 'false',
  ratings: process.env.NEXT_PUBLIC_ENABLE_RATINGS !== 'false',
} as const;
