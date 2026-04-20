export interface VersusOption {
  id: string;
  title: string;
}

export interface Duel {
  id: string;
  optionA: VersusOption;
  optionB: VersusOption;
  selectedWinner: VersusOption | null; // User's selection for this duel
  round: number;
}

export interface Round {
  roundNumber: number;
  duels: Duel[];
}

export interface Bracket {
  rounds: Round[];
  champion: VersusOption | null;
}

// User's completed bracket
export interface UserBracket {
  username: string;
  bracket: Bracket;
  champion: VersusOption | null;
  completedAt: string;
}

export interface VersusTournament {
  token: string;
  title: string;
  createdBy: string;
  options: VersusOption[];
  expiresAt: string; // ISO string
  bracket: Bracket; // Template bracket (no selections)
  userBrackets: Record<string, UserBracket>; // username -> completed bracket
  createdAt: string;
}
