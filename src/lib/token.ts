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
 * Gets remaining time in milliseconds
 */
export function getTimeRemaining(expiresAt: Date): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  return expiry.getTime() - now.getTime();
}

/**
 * Formats remaining time as a human-readable string
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
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
 * Checks if user has voted in a specific duel (for versus tournaments)
 */
export function hasVotedInDuel(token: string, duelId: string, username: string): boolean {
  const duelVoteKey = `pickly_versus_duel_${token}_${duelId}_${username}`;
  return localStorage.getItem(duelVoteKey) !== null;
}

/**
 * Marks that user has voted in a specific duel
 */
export function markDuelVote(token: string, duelId: string, username: string, optionId: string): void {
  const duelVoteKey = `pickly_versus_duel_${token}_${duelId}_${username}`;
  localStorage.setItem(duelVoteKey, optionId);
}

/**
 * Gets which option a user voted for in a duel
 */
export function getDuelVote(token: string, duelId: string, username: string): string | null {
  const duelVoteKey = `pickly_versus_duel_${token}_${duelId}_${username}`;
  return localStorage.getItem(duelVoteKey);
}

/**
 * Deletes tournament data from localStorage
 */
export function deleteTournamentData(token: string): void {
  const storageKey = `pickly_versus_${token}`;
  localStorage.removeItem(storageKey);
}
