/**
 * Token utility for generating and managing shareable links with expiration
 */

export interface TokenData {
  token: string;
  expiresAt: Date;
  type: 'vote' | 'ranking' | 'rating' | 'versus';
}

/**
 * Generates a short random unique token (6-8 alphanumeric chars, URL-safe)
 */
export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates the full shareable URL with the token
 */
export function generateShareLink(token: string, type: 'vote' | 'ranking' | 'rating' | 'versus'): string {
  const basePath = typeof window !== 'undefined' ? window.location.origin : '';
  const path = type === 'ranking' ? 'ranking' : type === 'rating' ? 'ratings' : type === 'versus' ? 'versus' : 'votes';
  return `${basePath}/${path}/${token}`;
}

/**
 * Checks if a poll has expired
 */
export function isExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Checks if a poll is in "terminal" state: either closed manually
 * by the creator (closedAt set) or expired by time.
 * A terminal poll stops accepting responses and shows the podium.
 */
export function isTerminal(expiresAt: Date, closedAt?: Date | string | null): boolean {
  if (closedAt) return true;
  return isExpired(expiresAt);
}

/**
 * Gets remaining time in milliseconds
 */
export function getTimeRemaining(expiresAt: Date): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  return expiry.getTime() - now.getTime();
}

/**
 * Formats remaining time as a compact, i18n-agnostic string (e.g. "2d", "3h", "45m", "30s")
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '—';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/**
 * Stores poll data in localStorage
 */
export function storePollData(token: string, data: any, type: 'vote' | 'ranking' | 'rating' | 'versus'): void {
  const storageKey = `pickly_${type}_${token}`;
  localStorage.setItem(storageKey, JSON.stringify(data));
}

/**
 * Retrieves poll data from localStorage
 */
export function getPollData(token: string, type: 'vote' | 'ranking' | 'rating' | 'versus'): any | null {
  const storageKey = `pickly_${type}_${token}`;
  const data = localStorage.getItem(storageKey);
  return data ? JSON.parse(data) : null;
}

/**
 * Checks if user has already voted on this poll from this device
 */
export function hasVoted(token: string, type: 'vote' | 'ranking' | 'rating' | 'versus'): boolean {
  const voteKey = `pickly_voted_${type}_${token}`;
  return localStorage.getItem(voteKey) !== null;
}

/**
 * Marks that user has voted on this poll
 */
export function markAsVoted(token: string, type: 'vote' | 'ranking' | 'rating' | 'versus'): void {
  const voteKey = `pickly_voted_${type}_${token}`;
  localStorage.setItem(voteKey, new Date().toISOString());
}

/**
 * Deletes tournament data from localStorage
 */
export function deleteTournamentData(token: string): void {
  const storageKey = `pickly_versus_${token}`;
  localStorage.removeItem(storageKey);
}

/**
 * Cleans up all localStorage keys related to polls, votes, rankings, ratings, and tournaments.
 * Only keeps pickly_username.
 */
export function cleanupLocalStorage(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];

  // Iterate through all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Keep pickly_username, remove everything else starting with 'pickly_'
    if (key.startsWith('pickly_') && key !== 'pickly_username') {
      keysToRemove.push(key);
    }
  }

  // Remove all identified keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log(`Cleaned up ${keysToRemove.length} localStorage keys`);
}
