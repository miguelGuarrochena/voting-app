import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY

// Fail loudly on boot if config is missing — better than silent 401 at runtime
if (!url || !key) {
  const msg =
    '[supabase] Missing environment variables: ' +
    `${!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!key ? 'NEXT_PUBLIC_SUPABASE_KEY' : ''}`.trim()
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error(msg)
  } else {
    // On server (build/SSR), throw so the user sees it in the console
    throw new Error(msg)
  }
}

export const supabase = createClient(url!, key!)
