export interface VersusOption {
  id: string;
  title: string;
}

export interface Duel {
  id: string;
  optionA: VersusOption;
  optionB: VersusOption;
  votesA: number;
  votesB: number;
  winner: VersusOption | null;
  isRandomWinner: boolean; // true if winner was chosen randomly on expiration
  round: number;
  voters: Record<string, string>; // username -> optionId
}

export interface Round {
  roundNumber: number;
  duels: Duel[];
}

export interface Bracket {
  rounds: Round[];
  currentRound: number;
  status: 'active' | 'finished' | 'expired';
  champion: VersusOption | null;
}

export interface VersusTournament {
  token: string;
  title: string;
  createdBy: string;
  options: VersusOption[];
  votesToWin: number;
  expiresAt: string; // ISO string
  bracket: Bracket;
  createdAt: string;
}

export interface VoteToWinSuggestion {
  groupSize: number;
  suggestedVotes: number;
}
