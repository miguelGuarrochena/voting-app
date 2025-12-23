export interface PollOption {
  id: string;
  text: string;
  votes: number;
  emoji?: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: Date;
  expiresAt: Date;
  isExpired: boolean;
  totalVotes: number;
  createdBy: string;
  userVotedOptionId?: string;
}

export const emojiOptions = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉', '💯',
  '🤔', '👌', '🙌', '💪', '👀', '🙏', '🤷', '🤦', '🤯', '🥳'
];

export const defaultEmoji = '🗳️';

export function getRandomEmoji() {
  return emojiOptions[Math.floor(Math.random() * emojiOptions.length)];
}
