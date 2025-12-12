import { create } from "zustand";
import type { RoomState, Room, Participant, VoteValue } from "../types";
import {
  clearSession,
  getLastAvatar,
  getLastNickname,
  loadStoredSession,
  persistSession,
} from "../lib/session";

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  currentParticipant: null,

  setRoom: (room: Room) => set((state) => {
    const newState = { currentRoom: room };
    persistSession(room, state.currentParticipant);
    return newState;
  }),

  setParticipant: (participant: Participant) => set((state) => {
    const newState = { currentParticipant: participant };
    persistSession(state.currentRoom, participant);
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
    clearSession();
    set({
      currentRoom: null,
      currentParticipant: null,
    });
  },
}));

export { getLastAvatar, getLastNickname, loadStoredSession as getStoredSession };
