import { useEffect, useState } from "react";
import type { TFunction } from "i18next";
import { useNavigate } from "react-router";
import { EMOJI_AVATARS } from "../../constants/decks";
import { useRoomService } from "../../hooks/useSupabase";
import {
  getLastAvatar,
  getLastNickname,
  getStoredSession,
  useRoomStore,
} from "../../stores/room.store";
import type { DeckType } from "../../types";

interface ValidationErrors {
  nickname?: string;
  roomId?: string;
  roomName?: string;
  password?: string;
}

interface ActiveSession {
  roomId: string;
  roomName: string;
  participantId: string;
}

export function useHomeController(t: TFunction<"translation">) {
  const navigate = useNavigate();
  const roomService = useRoomService();
  const { setRoom, setParticipant } = useRoomStore();

  const DEFAULT_AVATAR = EMOJI_AVATARS[0];
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [deckType] = useState<DeckType>("fibonacci");
  const [joinPassword, setJoinPassword] = useState("");
  const autoReveal = false;
  const [isSpectator, setIsSpectator] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingRoomInfo, setPendingRoomInfo] = useState<{
    id: string;
    name: string;
    hasPassword: boolean;
  } | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [showSessionPrompt, setShowSessionPrompt] = useState(false);

  useEffect(() => {
    const lastNickname = getLastNickname();
    const lastAvatar = getLastAvatar();

    if (lastNickname) {
      setNickname(lastNickname);
    }

    if (lastAvatar) {
      setAvatar(lastAvatar);
    }

    const checkActiveSession = async () => {
      const session = getStoredSession();
      if (!session) return;

      try {
        const roomInfo = await roomService.getRoomInfo(session.roomId);
        if (roomInfo) {
          setActiveSession({
            roomId: session.roomId,
            roomName: roomInfo.name,
            participantId: session.participantId,
          });
          setShowSessionPrompt(true);
        }
      } catch {
        sessionStorage.removeItem("scrum-room-session");
      }
    };

    checkActiveSession();
  }, [roomService]);

  const handleAvatarSelect = (value: string) => {
    setAvatar(value);
    try {
      localStorage.setItem("scrum-last-avatar", value);
    } catch (err) {
      console.warn("Unable to persist avatar", err);
    }
  };

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      setErrors((prev) => ({
        ...prev,
        nickname: t("errors.nicknameRequired"),
      }));
      return;
    }

    setIsLoading(true);
    try {
      const finalRoomName = roomName.trim() || `${nickname}'s Room`;
      const { room, participant } = await roomService.createRoom({
        roomName: finalRoomName,
        participantNickname: nickname.trim(),
        avatar,
        deckType,
        password: undefined,
        autoReveal,
        isSpectator,
      });

      setRoom(room);
      setParticipant(participant);
      navigate(`/room/${room.id}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      setErrors((prev) => ({ ...prev, roomName: "Failed to create room" }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (passwordOverride?: string) => {
    if (!nickname.trim()) {
      setErrors((prev) => ({
        ...prev,
        nickname: t("errors.nicknameRequired"),
      }));
      return;
    }

    if (!roomId.trim()) {
      setErrors((prev) => ({ ...prev, roomId: t("errors.roomIdRequired") }));
      return;
    }

    setIsLoading(true);
    try {
      setErrors((prev) => ({
        ...prev,
        roomId: undefined,
        password: undefined,
      }));
      const trimmedId = roomId.trim();

      const roomInfo = await roomService.getRoomInfo(trimmedId);
      const finalPassword = passwordOverride ?? joinPassword.trim();

      if (roomInfo.hasPassword && !finalPassword) {
        setPendingRoomInfo(roomInfo);
        setShowPasswordPrompt(true);
        setIsLoading(false);
        return;
      }

      const { room, participant } = await roomService.joinRoom({
        roomId: trimmedId,
        participantNickname: nickname.trim(),
        avatar,
        password: roomInfo.hasPassword ? finalPassword : undefined,
        isSpectator,
      });

      setRoom(room);
      setParticipant(participant);
      setJoinPassword("");
      setShowPasswordPrompt(false);
      setPendingRoomInfo(null);
      navigate(`/room/${room.id}`);
    } catch (error: any) {
      console.error("Failed to join room:", error);
      if (error.message === "Invalid password") {
        setErrors((prev) => ({
          ...prev,
          password: t("errors.invalidPassword"),
        }));
      } else {
        setErrors((prev) => ({ ...prev, roomId: t("errors.roomNotFound") }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissPasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setJoinPassword("");
    setErrors((prev) => ({ ...prev, password: undefined }));
  };

  const clearError = (field: keyof ValidationErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleResumeSession = () => {
    if (!activeSession) return;
    setIsLoading(true);
    navigate(`/room/${activeSession.roomId}`);
  };

  const resetErrors = () => setErrors({});

  return {
    DEFAULT_AVATAR,
    state: {
      activeTab,
      nickname,
      roomId,
      roomName,
      avatar,
      deckType,
      isSpectator,
    },
    modals: {
      showPasswordPrompt,
      pendingRoomInfo,
      joinPassword,
      showSessionPrompt,
      activeSession,
    },
    flags: {
      isLoading,
    },
    errors,
    actions: {
      setActiveTab,
      setNickname,
      setRoomId,
      setRoomName,
      setJoinPassword,
      setIsSpectator,
      handleAvatarSelect,
      handleCreateRoom,
      handleJoinRoom,
      handleDismissPasswordPrompt,
      setShowSessionPrompt,
      setActiveSession,
      handleResumeSession,
      clearError,
      resetErrors,
    },
  };
}
