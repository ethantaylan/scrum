import type { Participant, Room } from "../types";

// Session data stored in sessionStorage
export interface RoomSession {
  roomId: string;
  participantId: string;
  nickname: string;
  joinedAt: number;
}

const SESSION_KEY = "scrum-room-session";
const NICKNAME_KEY = "scrum-last-nickname";
const AVATAR_KEY = "scrum-last-avatar";

const isBrowser = typeof window !== "undefined";

export const persistSession = (room: Room | null, participant: Participant | null) => {
  if (!isBrowser) return;

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
    return;
  }

  sessionStorage.removeItem(SESSION_KEY);
};

export const loadStoredSession = (): RoomSession | null => {
  if (!isBrowser) return null;

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session: RoomSession = JSON.parse(stored);
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

export const clearSession = () => {
  if (!isBrowser) return;
  sessionStorage.removeItem(SESSION_KEY);
};

export const getLastNickname = (): string => {
  if (!isBrowser) return "";
  return localStorage.getItem(NICKNAME_KEY) || "";
};

export const getLastAvatar = (): string => {
  if (!isBrowser) return "";
  return localStorage.getItem(AVATAR_KEY) || "";
};
