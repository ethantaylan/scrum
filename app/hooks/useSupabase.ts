import { supabaseService } from '../services/supabase.service';

export function useSupabase() {
  // Note: Room subscriptions are now handled in room.$id.tsx to avoid duplicate subscriptions
  // This hook only provides service method bindings

  return {
    createRoom: supabaseService.createRoom.bind(supabaseService),
    joinRoom: supabaseService.joinRoom.bind(supabaseService),
    getRoomInfo: supabaseService.getRoomInfo.bind(supabaseService),
    reconnectToRoom: supabaseService.reconnectToRoom.bind(supabaseService),
    leaveRoom: supabaseService.leaveRoom.bind(supabaseService),
    castVote: supabaseService.castVote.bind(supabaseService),
    revealVotes: supabaseService.revealVotes.bind(supabaseService),
    resetVotes: supabaseService.resetVotes.bind(supabaseService),
    updateParticipantStatus: supabaseService.updateParticipantStatus.bind(supabaseService),
    updateParticipantProfile: supabaseService.updateParticipantProfile.bind(supabaseService),
    updateRoomName: supabaseService.updateRoomName.bind(supabaseService),
    toggleAutoReveal: supabaseService.toggleAutoReveal.bind(supabaseService),
    updateDeckType: supabaseService.updateDeckType.bind(supabaseService),
    kickParticipant: supabaseService.kickParticipant.bind(supabaseService),
    checkAllVoted: supabaseService.checkAllVoted.bind(supabaseService),
  };
}
