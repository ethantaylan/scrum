import { supabase } from '../lib/supabase';
import type { Room, Participant, VoteValue, DeckType } from '../types';
import type { Database } from '../types/database.types';

type DBRoom = Database['public']['Tables']['rooms']['Row'];
type DBParticipant = Database['public']['Tables']['participants']['Row'];

export interface CreateRoomOptions {
  roomName: string;
  participantNickname: string;
  avatar: string;
  deckType: DeckType;
  password?: string;
  autoReveal: boolean;
}

export interface JoinRoomOptions {
  roomId: string;
  participantNickname: string;
  avatar: string;
  password?: string;
  isSpectator?: boolean;
}

export interface RoomInfo {
  id: string;
  name: string;
  hasPassword: boolean;
  autoReveal: boolean;
}

class SupabaseService {
  async getRoomInfo(roomId: string): Promise<RoomInfo> {
    const { data: roomData, error } = await supabase
      .from('rooms')
      .select('id, name, password, auto_reveal')
      .eq('id', roomId)
      .single();

    if (error || !roomData) {
      throw new Error('Room not found');
    }

    return {
      id: roomData.id,
      name: roomData.name,
      hasPassword: !!roomData.password,
      autoReveal: roomData.auto_reveal,
    };
  }

  async createRoom(options: CreateRoomOptions): Promise<{ room: Room; participant: Participant }> {
    // Create room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name: options.roomName,
        deck_type: options.deckType,
        password: options.password || null,
        auto_reveal: options.autoReveal ?? false,
      })
      .select()
      .single();

    if (roomError) throw roomError;

    // Create participant (creator)
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .insert({
        room_id: roomData.id,
        nickname: options.participantNickname,
        avatar: options.avatar,
        is_spectator: false,
      })
      .select()
      .single();

    if (participantError) throw participantError;

    // Update room with creator_id
    await supabase
      .from('rooms')
      .update({ creator_id: participantData.id })
      .eq('id', roomData.id);

    const room = await this.getRoomWithParticipants(roomData.id);
    const participant = this.mapParticipant(participantData);

    return { room, participant };
  }

  async joinRoom(options: JoinRoomOptions): Promise<{ room: Room; participant: Participant }> {
    // Check if room exists
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('id', options.roomId)
      .single();

    if (roomError) throw new Error('Room not found');

    // Verify password if room is protected
    if (roomData.password && roomData.password !== options.password) {
      throw new Error('Invalid password');
    }

    // Create participant
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .insert({
        room_id: options.roomId,
        nickname: options.participantNickname,
        avatar: options.avatar,
        is_spectator: options.isSpectator || false,
      })
      .select()
      .single();

    if (participantError) throw participantError;

    const room = await this.getRoomWithParticipants(options.roomId);
    const participant = this.mapParticipant(participantData);

    return { room, participant };
  }

  async reconnectToRoom(roomId: string, participantId: string): Promise<{ room: Room; participant: Participant } | null> {
    // Check if room exists
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('id', roomId)
      .single();

    if (roomError) return null;

    // Check if participant still exists in the room
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .select()
      .eq('id', participantId)
      .eq('room_id', roomId)
      .single();

    if (participantError || !participantData) return null;

    // Update participant status to online
    await this.updateParticipantStatus(participantId, true);

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

  async updateParticipantProfile(participantId: string, updates: { nickname?: string; avatar?: string }): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (updates.nickname !== undefined) updateData.nickname = updates.nickname;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

    const { error } = await supabase
      .from('participants')
      .update(updateData)
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

  async kickParticipant(roomId: string, participantId: string, creatorId: string): Promise<void> {
    // Verify creator
    const { data: roomData } = await supabase
      .from('rooms')
      .select('creator_id')
      .eq('id', roomId)
      .single();

    if (!roomData || roomData.creator_id !== creatorId) {
      throw new Error('Unauthorized');
    }

    // Cannot kick creator
    if (participantId === creatorId) {
      throw new Error('Cannot kick room creator');
    }

    await this.leaveRoom(roomId, participantId);
  }

  async updateRoomName(roomId: string, newName: string, creatorId: string): Promise<void> {
    // Verify creator
    const { data: roomData } = await supabase
      .from('rooms')
      .select('creator_id')
      .eq('id', roomId)
      .single();

    if (!roomData || roomData.creator_id !== creatorId) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('rooms')
      .update({ name: newName })
      .eq('id', roomId);

    if (error) throw error;
  }

  async toggleAutoReveal(roomId: string, autoReveal: boolean, creatorId: string): Promise<void> {
    // Verify creator
    const { data: roomData } = await supabase
      .from('rooms')
      .select('creator_id')
      .eq('id', roomId)
      .single();

    if (!roomData || roomData.creator_id !== creatorId) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('rooms')
      .update({ auto_reveal: autoReveal })
      .eq('id', roomId);

    if (error) throw error;
  }

  async updateDeckType(roomId: string, deckType: DeckType, creatorId: string): Promise<void> {
    const { data: roomData } = await supabase
      .from('rooms')
      .select('creator_id')
      .eq('id', roomId)
      .single();

    if (!roomData || roomData.creator_id !== creatorId) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('rooms')
      .update({ deck_type: deckType })
      .eq('id', roomId);

    if (error) throw error;
  }

  async checkAllVoted(roomId: string): Promise<boolean> {
    const { data: participants } = await supabase
      .from('participants')
      .select('has_voted, is_spectator')
      .eq('room_id', roomId);

    if (!participants) return false;

    const voters = participants.filter(p => !p.is_spectator);
    return voters.length > 0 && voters.every(p => p.has_voted);
  }

  private mapRoom(roomData: DBRoom, participantsData: DBParticipant[]): Room {
    return {
      id: roomData.id,
      name: roomData.name,
      isRevealed: roomData.is_revealed,
      createdAt: roomData.created_at,
      creatorId: roomData.creator_id,
      deckType: roomData.deck_type as DeckType,
      password: roomData.password,
      autoReveal: roomData.auto_reveal,
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
      isSpectator: data.is_spectator,
      avatar: data.avatar,
    };
  }
}

export const supabaseService = new SupabaseService();
