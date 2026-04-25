export type TournamentMode = 'bracket' | 'league';
export type TournamentStatus = 'active' | 'finished';

export interface Player {
  id: string;
  name: string;
}

// Result with score (e.g., FIFA, basketball)
export interface ScoreResult {
  type: 'score';
  scoreA: number;
  scoreB: number;
}

// Result without score (e.g., Street Fighter, chess)
export interface WinLossResult {
  type: 'winloss';
  winner: 'A' | 'B' | 'draw';
}

export type MatchResult = ScoreResult | WinLossResult | null;

export interface Match {
  id: string;
  playerA: Player;
  playerB: Player;
  result: MatchResult;
  round: number;
  status: 'pending' | 'completed';
}

// Bracket-specific match with position info
export interface BracketMatch extends Match {
  position: number; // Position in the bracket (0, 1, 2, 3, etc.)
  nextMatchId: string | null; // ID of the match this winner advances to
  nextMatchPosition: 'A' | 'B' | null; // Whether winner goes to optionA or optionB of next match
}

// League-specific match
export interface LeagueMatch extends Match {
  // No additional fields needed for league
}

// League standings row
export interface LeagueStanding {
  player: Player;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

// Tournament data structure
export interface Tournament {
  token: string;
  title: string;
  createdBy: string;
  mode: TournamentMode;
  hasScore: boolean; // true if sport has numerical results (FIFA, basketball)
  players: Player[];
  matches: Match[];
  status: TournamentStatus;
  createdAt: string;
  expiresAt: string; // ISO string - always 24h after creation
  description?: string;
  coverImage?: string;
}

// Helper to determine winner from score result
export function getScoreWinner(result: ScoreResult): 'A' | 'B' | 'draw' {
  if (result.scoreA > result.scoreB) return 'A';
  if (result.scoreB > result.scoreA) return 'B';
  return 'draw';
}
