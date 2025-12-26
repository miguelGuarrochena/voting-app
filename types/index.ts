export type PollOption = {
  id: string;
  text: string;
  emoji?: string;
  image?: string;
};

export type Participant = {
  id: string;
  emailOrUsername: string;
};

export type Poll = {
  id: string;
  title: string;
  description?: string;
  expirationDate: string;
  isPrivate: boolean;
  isAnonymous: boolean;
  options: PollOption[];
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
};
