import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY

// Falla ruidoso en boot si falta config — mejor que 401 silencioso en runtime
if (!url || !key) {
  const msg =
    '[supabase] Variables de entorno faltantes: ' +
    `${!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!key ? 'NEXT_PUBLIC_SUPABASE_KEY' : ''}`.trim()
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error(msg)
  } else {
    // En server (build/SSR), lanza para que el usuario lo vea en consola
    throw new Error(msg)
  }
}

export const supabase = createClient(url!, key!)

// ------------------------------------------------------------
// DIAGNÓSTICO TEMPORAL — borrar cuando se resuelva el 42501
// Corre whoami() al boot y dumpea a consola. Nos dice qué rol
// ve Postgres cuando la app hace requests.
// ------------------------------------------------------------
if (typeof window !== 'undefined') {
  supabase.rpc('whoami').then(({ data, error }) => {
    // eslint-disable-next-line no-console
    console.log('[whoami]', { data, error })
  })
}
