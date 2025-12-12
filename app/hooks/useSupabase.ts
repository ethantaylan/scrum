import type { RoomService } from "../services/roomService";
import { roomService } from "../services/roomService";

export function useRoomService(): RoomService {
  return roomService;
}

// Backwards compatibility for existing imports
export const useSupabase = useRoomService;
