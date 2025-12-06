export type VoteValue = '0' | '1' | '2' | '3' | '5' | '8' | '13' | '21' | '34' | '55' | '89' | '?' | '☕';

export interface Participant {
  id: string;
  nickname: string;
  hasVoted: boolean;
  vote: VoteValue | null;
  isOnline: boolean;
}

export interface Room {
  id: string;
  name: string;
  participants: Participant[];
  isRevealed: boolean;
  createdAt: string;
}

export interface Vote {
  participantId: string;
  value: VoteValue;
  timestamp: string;
}

export interface RoomState {
  currentRoom: Room | null;
  currentParticipant: Participant | null;
  setRoom: (room: Room) => void;
  setParticipant: (participant: Participant) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipant: (participantId: string, updates: Partial<Participant>) => void;
  castVote: (participantId: string, vote: VoteValue) => void;
  revealVotes: () => void;
  resetVotes: () => void;
  leaveRoom: () => void;
}

export type Theme = 'light' | 'dark';

export type Language = 'en' | 'fr';

export interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}
