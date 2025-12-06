import { create } from 'zustand';
import type { RoomState, Room, Participant, VoteValue } from '../types';

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  currentParticipant: null,

  setRoom: (room: Room) => set({ currentRoom: room }),

  setParticipant: (participant: Participant) => set({ currentParticipant: participant }),

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

  leaveRoom: () =>
    set({
      currentRoom: null,
      currentParticipant: null,
    }),
}));
