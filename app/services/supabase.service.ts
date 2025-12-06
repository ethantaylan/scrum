import { supabase } from '../lib/supabase';
import type { Room, Participant, VoteValue } from '../types';
import type { Database } from '../types/database.types';

type DBRoom = Database['public']['Tables']['rooms']['Row'];
type DBParticipant = Database['public']['Tables']['participants']['Row'];

class SupabaseService {
  async createRoom(roomName: string, participantNickname: string): Promise<{ room: Room; participant: Participant }> {
    // Create room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert({ name: roomName })
      .select()
      .single();

    if (roomError) throw roomError;

    // Create participant
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .insert({
        room_id: roomData.id,
        nickname: participantNickname,
      })
      .select()
      .single();

    if (participantError) throw participantError;

    const room = await this.getRoomWithParticipants(roomData.id);
    const participant = this.mapParticipant(participantData);

    return { room, participant };
  }

  async joinRoom(roomId: string, participantNickname: string): Promise<{ room: Room; participant: Participant }> {
    // Check if room exists
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('id', roomId)
      .single();

    if (roomError) throw new Error('Room not found');

    // Create participant
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .insert({
        room_id: roomId,
        nickname: participantNickname,
      })
      .select()
      .single();

    if (participantError) throw participantError;

    const room = await this.getRoomWithParticipants(roomId);
    const participant = this.mapParticipant(participantData);

    return { room, participant };
  }

  async leaveRoom(roomId: string, participantId: string): Promise<void> {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId)
      .eq('room_id', roomId);

    if (error) throw error;
  }

  async castVote(participantId: string, vote: VoteValue): Promise<void> {
    const { error } = await supabase
      .from('participants')
      .update({
        vote,
        has_voted: true,
      })
      .eq('id', participantId);

    if (error) throw error;
  }

  async revealVotes(roomId: string): Promise<void> {
    const { error } = await supabase
      .from('rooms')
      .update({ is_revealed: true })
      .eq('id', roomId);

    if (error) throw error;
  }

  async resetVotes(roomId: string): Promise<void> {
    // Reset room
    const { error: roomError } = await supabase
      .from('rooms')
      .update({ is_revealed: false })
      .eq('id', roomId);

    if (roomError) throw roomError;

    // Reset all participants' votes
    const { error: participantsError } = await supabase
      .from('participants')
      .update({
        vote: null,
        has_voted: false,
      })
      .eq('room_id', roomId);

    if (participantsError) throw participantsError;
  }

  async updateParticipantStatus(participantId: string, isOnline: boolean): Promise<void> {
    const { error } = await supabase
      .from('participants')
      .update({ is_online: isOnline })
      .eq('id', participantId);

    if (error) throw error;
  }

  async getRoomWithParticipants(roomId: string): Promise<Room> {
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError) throw roomError;

    const { data: participantsData, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', roomId);

    if (participantsError) throw participantsError;

    return this.mapRoom(roomData, participantsData || []);
  }

  subscribeToRoom(roomId: string, callback: (room: Room) => void) {
    const channel = supabase.channel(`room:${roomId}`);

    // Subscribe to room changes
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        async () => {
          const room = await this.getRoomWithParticipants(roomId);
          callback(room);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const room = await this.getRoomWithParticipants(roomId);
          callback(room);
        }
      )
      .subscribe();

    return channel;
  }

  unsubscribeFromRoom(channel: any) {
    supabase.removeChannel(channel);
  }

  private mapRoom(roomData: DBRoom, participantsData: DBParticipant[]): Room {
    return {
      id: roomData.id,
      name: roomData.name,
      isRevealed: roomData.is_revealed,
      createdAt: roomData.created_at,
      participants: participantsData.map(this.mapParticipant),
    };
  }

  private mapParticipant(data: DBParticipant): Participant {
    return {
      id: data.id,
      nickname: data.nickname,
      vote: data.vote as VoteValue | null,
      hasVoted: data.has_voted,
      isOnline: data.is_online,
    };
  }
}

export const supabaseService = new SupabaseService();
