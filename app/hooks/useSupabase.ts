import { useEffect, useRef } from 'react';
import { supabaseService } from '../services/supabase.service';
import { useRoomStore } from '../stores/room.store';
import type { VoteValue } from '../types';

export function useSupabase() {
  const { currentRoom, setRoom } = useRoomStore();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Subscribe to room changes if we have a current room
    if (currentRoom?.id) {
      channelRef.current = supabaseService.subscribeToRoom(currentRoom.id, (room) => {
        setRoom(room);
      });
    }

    return () => {
      if (channelRef.current) {
        supabaseService.unsubscribeFromRoom(channelRef.current);
      }
    };
  }, [currentRoom?.id, setRoom]);

  return {
    createRoom: async (roomName: string, participantNickname: string) => {
      return await supabaseService.createRoom(roomName, participantNickname);
    },
    joinRoom: async (roomId: string, participantNickname: string) => {
      return await supabaseService.joinRoom(roomId, participantNickname);
    },
    leaveRoom: async (roomId: string, participantId: string) => {
      await supabaseService.leaveRoom(roomId, participantId);
    },
    castVote: async (participantId: string, vote: VoteValue) => {
      await supabaseService.castVote(participantId, vote);
    },
    revealVotes: async (roomId: string) => {
      await supabaseService.revealVotes(roomId);
    },
    resetVotes: async (roomId: string) => {
      await supabaseService.resetVotes(roomId);
    },
    updateParticipantStatus: async (participantId: string, isOnline: boolean) => {
      await supabaseService.updateParticipantStatus(participantId, isOnline);
    },
  };
}
