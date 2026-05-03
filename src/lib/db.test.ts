/**
 * Unit tests for db.ts — focused on deletePoll / deleteTournament,
 * which are the functions the listing-page bug touched.
 *
 * Strategy: mock the supabase client and react-hot-toast so we can
 * assert the branching without hitting a real DB.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks (must be declared before importing db.ts) -----------------

const rpcMock = vi.fn()
const getSessionMock = vi.fn()

vi.mock('./supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    auth: {
      getSession: () => getSessionMock(),
    },
    from: vi.fn(),
  },
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}))

// Important: import after mocks
import { deletePoll, deleteTournament } from './db'

beforeEach(() => {
  rpcMock.mockReset()
  getSessionMock.mockReset()
  toastSuccess.mockReset()
  toastError.mockReset()
})

// --- deletePoll ------------------------------------------------------

describe('deletePoll', () => {
  it('returns true on happy path (RPC returns true)', async () => {
    rpcMock.mockResolvedValue({ data: true, error: null })

    const ok = await deletePoll('tok-1')

    expect(ok).toBe(true)
    expect(rpcMock).toHaveBeenCalledWith('delete_poll_rpc', { p_token: 'tok-1' })
    expect(toastError).not.toHaveBeenCalled()
  })

  it('returns false when RPC returns non-true (no error) and toasts a friendly message', async () => {
    rpcMock.mockResolvedValue({ data: false, error: null })

    const ok = await deletePoll('tok-2')

    expect(ok).toBe(false)
    expect(toastError).toHaveBeenCalledTimes(1)
    expect(String(toastError.mock.calls[0][0])).toMatch(/no pudimos borrar la encuesta/i)
  })

  it('returns false and shows "iniciá sesión con la otra cuenta" toast when forbidden + logged in', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'forbidden', code: 'P0001' },
    })
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: 'user-A' } } },
    })

    const ok = await deletePoll('tok-3')

    expect(ok).toBe(false)
    expect(toastError).toHaveBeenCalledTimes(1)
    expect(String(toastError.mock.calls[0][0])).toMatch(/otra cuenta/i)
  })

  it('returns false and shows "iniciá sesión" toast when forbidden + anonymous', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'forbidden', code: 'P0001' },
    })
    getSessionMock.mockResolvedValue({ data: { session: null } })

    const ok = await deletePoll('tok-4')

    expect(ok).toBe(false)
    expect(toastError).toHaveBeenCalledTimes(1)
    expect(String(toastError.mock.calls[0][0])).toMatch(/iniciá sesión/i)
  })

  it('detects forbidden by error code even when message is not literally "forbidden"', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'some other text', code: 'P0001' },
    })
    getSessionMock.mockResolvedValue({ data: { session: null } })

    const ok = await deletePoll('tok-5')
    expect(ok).toBe(false)
    expect(toastError).toHaveBeenCalledTimes(1)
  })

  it('catches unexpected supabase errors, returns false and toasts via the logger', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'connection failed', code: '500', status: 500 },
    })
    // No session lookup needed — this isn't a forbidden, it's "throw error"
    const ok = await deletePoll('tok-6')

    expect(ok).toBe(false)
    expect(toastError).toHaveBeenCalled()
  })
})

// --- deleteTournament ------------------------------------------------

describe('deleteTournament', () => {
  it('returns true on happy path', async () => {
    rpcMock.mockResolvedValue({ data: true, error: null })
    const ok = await deleteTournament('t-1')
    expect(ok).toBe(true)
    expect(rpcMock).toHaveBeenCalledWith('delete_tournament_rpc', { p_token: 't-1' })
  })

  it('returns false and toasts torneo-specific message on data !== true', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })
    const ok = await deleteTournament('t-2')
    expect(ok).toBe(false)
    expect(String(toastError.mock.calls[0][0])).toMatch(/no pudimos borrar el torneo/i)
  })

  it('returns false and toasts torneo-specific forbidden message when logged in', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'forbidden', code: 'P0001' },
    })
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: 'user-X' } } },
    })

    const ok = await deleteTournament('t-3')
    expect(ok).toBe(false)
    expect(String(toastError.mock.calls[0][0])).toMatch(/torneo.*otra cuenta/i)
  })
})
