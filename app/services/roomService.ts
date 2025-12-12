import type { Room, Participant, VoteValue, DeckType } from "../types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  supabaseService,
  type CreateRoomOptions,
  type JoinRoomOptions,
  type RoomInfo,
} from "./supabase.service";

export interface RoomService {
  getRoomInfo(roomId: string): Promise<RoomInfo>;
  createRoom(options: CreateRoomOptions): Promise<{ room: Room; participant: Participant }>;
  joinRoom(options: JoinRoomOptions): Promise<{ room: Room; participant: Participant }>;
  reconnectToRoom(roomId: string, participantId: string): Promise<{ room: Room; participant: Participant } | null>;
  leaveRoom(roomId: string, participantId: string): Promise<void>;
  castVote(participantId: string, vote: VoteValue): Promise<void>;
  revealVotes(roomId: string): Promise<void>;
  resetVotes(roomId: string): Promise<void>;
  updateParticipantStatus(participantId: string, isOnline: boolean): Promise<void>;
  updateParticipantLastSeen(participantId: string): Promise<void>;
  updateParticipantProfile(participantId: string, updates: { nickname?: string; avatar?: string }): Promise<void>;
  updateRoomName(roomId: string, newName: string, creatorId: string): Promise<void>;
  toggleAutoReveal(roomId: string, autoReveal: boolean, creatorId: string): Promise<void>;
  updateDeckType(roomId: string, deckType: DeckType, creatorId: string): Promise<void>;
  kickParticipant(roomId: string, participantId: string, creatorId: string): Promise<void>;
  checkAllVoted(roomId: string): Promise<boolean>;
  getRoomWithParticipants(roomId: string): Promise<Room>;
  subscribeToRoom(
    roomId: string,
    participantId: string,
    callback: (room: Room) => void,
    onPresenceChange?: (onlineParticipantIds: string[]) => void
  ): RealtimeChannel;
  unsubscribeFromRoom(channel: RealtimeChannel): void;
}

export const roomService: RoomService = supabaseService;
export type { CreateRoomOptions, JoinRoomOptions, RoomInfo };
