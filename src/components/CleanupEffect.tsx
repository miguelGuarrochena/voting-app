'use client'

import { useEffect } from 'react'
import { cleanupLocalStorage } from '@/lib/token'

export function CleanupEffect() {
  useEffect(() => {
    // One-time localStorage cleanup for migration from localStorage to Supabase
    const hasCleanedUp = localStorage.getItem('pickly_localStorage_cleaned')
    if (!hasCleanedUp) {
      cleanupLocalStorage()
      localStorage.setItem('pickly_localStorage_cleaned', 'true')
    }

    // Fire and forget cleanup call for expired polls/tournaments
    fetch('/api/cleanup').catch(err => {
      console.error('Cleanup call failed:', err)
    })
  }, [])

  return null
}
