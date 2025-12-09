import { create } from 'zustand';
import type { RoomState, Room, Participant, VoteValue } from '../types';

// Session data stored in sessionStorage
interface RoomSession {
  roomId: string;
  participantId: string;
  nickname: string;
  joinedAt: number;
}

const SESSION_KEY = 'scrum-room-session';
const NICKNAME_KEY = 'scrum-last-nickname';
const AVATAR_KEY = 'scrum-last-avatar';

// Save session to sessionStorage
const saveSession = (room: Room | null, participant: Participant | null) => {
  if (typeof window === 'undefined') return;

  if (room && participant) {
    const session: RoomSession = {
      roomId: room.id,
      participantId: participant.id,
      nickname: participant.nickname,
      joinedAt: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(NICKNAME_KEY, participant.nickname);
    localStorage.setItem(AVATAR_KEY, participant.avatar);
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
};

// Get session from sessionStorage
export const getStoredSession = (): RoomSession | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session: RoomSession = JSON.parse(stored);

    // Expire sessions older than 24 hours
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - session.joinedAt > maxAge) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
};

// Get last used nickname
export const getLastNickname = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(NICKNAME_KEY) || '';
};

export const getLastAvatar = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AVATAR_KEY) || '';
};

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  currentParticipant: null,

  setRoom: (room: Room) => set((state) => {
    const newState = { currentRoom: room };
    saveSession(room, state.currentParticipant);
    return newState;
  }),

  setParticipant: (participant: Participant) => set((state) => {
    const newState = { currentParticipant: participant };
    saveSession(state.currentRoom, participant);
    return newState;
  }),

  addParticipant: (participant: Participant) =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          participants: [...state.currentRoom.participants, participant],
        },
      };
    }),

  removeParticipant: (participantId: string) =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          participants: state.currentRoom.participants.filter((p) => p.id !== participantId),
        },
      };
    }),

  updateParticipant: (participantId: string, updates: Partial<Participant>) =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          participants: state.currentRoom.participants.map((p) =>
            p.id === participantId ? { ...p, ...updates } : p
          ),
        },
      };
    }),

  castVote: (participantId: string, vote: VoteValue) =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          participants: state.currentRoom.participants.map((p) =>
            p.id === participantId ? { ...p, vote, hasVoted: true } : p
          ),
        },
      };
    }),

  revealVotes: () =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          isRevealed: true,
        },
      };
    }),

  resetVotes: () =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          isRevealed: false,
          participants: state.currentRoom.participants.map((p) => ({
            ...p,
            vote: null,
            hasVoted: false,
          })),
        },
      };
    }),

  leaveRoom: () => {
    saveSession(null, null);
    set({
      currentRoom: null,
      currentParticipant: null,
    });
  },
}));
