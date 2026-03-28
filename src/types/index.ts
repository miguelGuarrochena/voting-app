// Photo Voting App Types

export type ReactionType = '🔥' | '😍' | '👑' | '✨' | '💀' | '😬' | '👎' | '🙈';

export const POSITIVE_EMOJIS: ReactionType[] = ['🔥', '😍', '👑', '✨'];
export const NEGATIVE_EMOJIS: ReactionType[] = ['💀', '😬', '👎', '🙈'];

export interface ReactionCount {
  '🔥': number;
  '😍': number;
  '👑': number;
  '✨': number;
  '💀': number;
  '😬': number;
  '👎': number;
  '🙈': number;
}

export interface Candidate {
  id: string;
  name: string;
  imageUrl: string;
  votes: ReactionCount;
}

export type PollType = 'podium' | 'yes-no' | 'ranking';

export interface Poll {
  id: string;
  title: string;
  type: PollType;
  isPublic: boolean;
  shortCode: string;
  createdAt: Date;
  endsAt: Date | null;
  candidates: Candidate[];
}

export interface VoteScore {
  pos: number;
  neg: number;
  total: number;
  score: number;
}
