import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TFunction } from "i18next";
import { useNavigate } from "react-router";
import { DECKS, EMOJI_AVATARS } from "../../constants/decks";
import { useRoomService } from "../../hooks/useSupabase";
import {
  getLastAvatar,
  getLastNickname,
  getStoredSession,
  useRoomStore,
} from "../../stores/room.store";
import type { DeckType, VoteValue } from "../../types";
import { parseVoteToNumber } from "../../lib/votes";

interface UseRoomControllerArgs {
  roomId?: string;
  t: TFunction<"translation">;
}

export function useRoomController({ roomId, t }: UseRoomControllerArgs) {
  const navigate = useNavigate();
  const service = useRoomService();
  const {
    currentRoom,
    currentParticipant,
    setRoom,
    setParticipant,
    leaveRoom: clearRoom,
  } = useRoomStore();
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
  const [copied, setCopied] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [joinModalPassword, setJoinModalPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [isRecoveringSession, setIsRecoveringSession] = useState(true);
  const [joinAsSpectator, setJoinAsSpectator] = useState(false);
  const defaultAvatar =
    (typeof window !== "undefined" && getLastAvatar()) || EMOJI_AVATARS[0];
  const [joinModalAvatar, setJoinModalAvatar] = useState(defaultAvatar);
  const [confettiPlayed, setConfettiPlayed] = useState(false);
  const [autoRevealTriggered, setAutoRevealTriggered] = useState(false);
  const [showEveryoneVoted, setShowEveryoneVoted] = useState(false);
  const [revealCountdown, setRevealCountdown] = useState<number | null>(null);
  const [isTogglingAutoReveal, setIsTogglingAutoReveal] = useState(false);
  const [isUpdatingDeck, setIsUpdatingDeck] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const deckConfig = useMemo(() => {
    if (!currentRoom) return DECKS.fibonacci;
    return DECKS[currentRoom.deckType] || DECKS.fibonacci;
  }, [currentRoom]);

  const numericVoteOptions = deckConfig.numeric;
  const specialVoteOptions = deckConfig.special;
  const voters = useMemo(
    () =>
      currentRoom ? currentRoom.participants.filter((p) => !p.isSpectator) : [],
    [currentRoom]
  );

  const averageVote = useMemo(() => {
    if (!currentRoom?.isRevealed) return null;

    const numericVotes = voters
      .filter((p) => p.hasVoted && p.vote !== null)
      .map((p) => parseVoteToNumber(p.vote))
      .filter((v): v is number => v !== null);

    if (!numericVotes.length) return null;
    const sum = numericVotes.reduce((a, b) => a + b, 0);
    return Math.round(sum / numericVotes.length);
  }, [currentRoom?.isRevealed, voters]);

  const handleReveal = useCallback(async () => {
    if (!currentRoom) return;
    setRoom({ ...currentRoom, isRevealed: true });
    try {
      await service.revealVotes(currentRoom.id);
    } catch (error) {
      console.error("Failed to reveal votes:", error);
    }
  }, [currentRoom, service, setRoom]);

  const startRevealCountdown = useCallback(() => {
    if (!currentRoom || currentRoom.isRevealed || revealCountdown !== null) return;
    setRevealCountdown(2);
  }, [currentRoom, revealCountdown]);

  const votedCount = voters.filter((p) => p.hasVoted).length;
  const totalVoters = voters.length;

  const allVoted = voters.length > 0 && voters.every((p) => p.hasVoted);
  const isRevealingSoon = revealCountdown !== null;

  useEffect(() => {
    if (revealCountdown === null) return;

    if (revealCountdown === 0) {
      handleReveal();
      setRevealCountdown(null);
      return;
    }

    const timer = setTimeout(
      () =>
        setRevealCountdown((prev) =>
          prev !== null ? Math.max(prev - 1, 0) : prev
        ),
      1000
    );
    return () => clearTimeout(timer);
  }, [handleReveal, revealCountdown]);

  useEffect(() => {
    const lastNickname = getLastNickname();
    if (lastNickname) {
      setNickname(lastNickname);
    }
  }, []);

  useEffect(() => {
    const recoverSession = async () => {
      const storedSession = getStoredSession();

      if (storedSession && storedSession.roomId === roomId) {
        try {
          const result = await service.reconnectToRoom(
            storedSession.roomId,
            storedSession.participantId
          );

          if (result) {
            setRoom(result.room);
            setParticipant(result.participant);
            setShowJoinModal(false);
          } else {
            setShowJoinModal(true);
          }
        } catch (error) {
          console.error("Failed to recover session:", error);
          setShowJoinModal(true);
        }
      } else {
        setShowJoinModal(true);
      }

      setIsRecoveringSession(false);
    };

    if (!currentRoom || !currentParticipant) {
      recoverSession();
    } else {
      setIsRecoveringSession(false);
    }
  }, [currentRoom, currentParticipant, roomId, service, setParticipant, setRoom]);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      if (!roomId || !showJoinModal) return;
      try {
        const info = await service.getRoomInfo(roomId);
        setNeedsPassword(info.hasPassword);
      } catch {
        setNeedsPassword(false);
      }
    };

    fetchRoomInfo();
  }, [roomId, service, showJoinModal]);

  // Track online status via presence (handled in subscribeToRoom now)
  const onlineParticipantIdsRef = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (!currentRoom) return;

    if (currentRoom.isRevealed) {
      setShowEveryoneVoted(false);
      setAutoRevealTriggered(false);
      setRevealCountdown(null);
      return;
    }

    if (allVoted) {
      setShowEveryoneVoted(true);

      if (currentRoom.autoReveal && !autoRevealTriggered && revealCountdown === null) {
        setAutoRevealTriggered(true);
        startRevealCountdown();
      }
    } else {
      setShowEveryoneVoted(false);
      if (autoRevealTriggered) {
        setRevealCountdown(null);
        setAutoRevealTriggered(false);
      }
    }
  }, [allVoted, autoRevealTriggered, currentRoom, revealCountdown, startRevealCountdown]);

  const handleVote = async (vote: VoteValue) => {
    if (!currentRoom || !currentParticipant || currentRoom.isRevealed) return;

    setSelectedVote(vote);
    setRoom({
      ...currentRoom,
      participants: currentRoom.participants.map((p) =>
        p.id === currentParticipant.id ? { ...p, vote, hasVoted: true } : p
      ),
    });
    try {
      await service.castVote(currentParticipant.id, vote);
    } catch (error) {
      console.error("Failed to cast vote:", error);
    }
  };

  const handleReset = useCallback(async () => {
    if (!currentRoom) return;
    setSelectedVote(null);
    setShowEveryoneVoted(false);
    setAutoRevealTriggered(false);
    setRevealCountdown(null);
    setConfettiPlayed(false);
    setRoom({
      ...currentRoom,
      isRevealed: false,
      participants: currentRoom.participants.map((p) => ({
        ...p,
        vote: null,
        hasVoted: false,
      })),
    });
    try {
      await service.resetVotes(currentRoom.id);
    } catch (error) {
      console.error("Failed to reset votes:", error);
    }
  }, [currentRoom, service, setRoom]);

  const handleLeave = async () => {
    if (!currentRoom || !currentParticipant) return;
    try {
      await service.leaveRoom(currentRoom.id, currentParticipant.id);
      clearRoom();
      navigate("/");
    } catch (error) {
      console.error("Failed to leave room:", error);
      clearRoom();
      navigate("/");
    }
  };

  const handleCopyLink = useCallback(async () => {
    const roomIdToCopy = currentRoom?.id || roomId || "";
    if (!roomIdToCopy) return;
    try {
      const fullUrl = `${window.location.origin}/room/${roomIdToCopy}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy room link:", err);
    }
  }, [currentRoom?.id, roomId]);

  const triggerConfetti = useCallback(() => {
    if (typeof document === "undefined") return;

    const colors = ["#2563eb", "#f97316", "#10b981", "#eab308", "#ec4899"];
    const container = document.createElement("div");
    container.className = "confetti-layer";

    for (let i = 0; i < 70; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDuration = `${0.9 + Math.random() * 0.7}s`;
      piece.style.animationDelay = `${Math.random() * 0.2}s`;
      container.appendChild(piece);
    }

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 1600);
  }, []);

  const handleToggleAutoReveal = useCallback(async () => {
    if (!currentRoom || !currentParticipant) return;
    const previous = currentRoom.autoReveal;
    const next = !previous;
    setRoom({ ...currentRoom, autoReveal: next });
    setIsTogglingAutoReveal(true);
    try {
      await service.toggleAutoReveal(currentRoom.id, next, currentParticipant.id);
    } catch (error) {
      console.error("Failed to toggle auto reveal:", error);
      setRoom({ ...currentRoom, autoReveal: previous });
    } finally {
      setIsTogglingAutoReveal(false);
    }
  }, [currentParticipant, currentRoom, service, setRoom]);

  const handleDeckChange = useCallback(
    async (deck: DeckType) => {
      if (!currentRoom || !currentParticipant) return;
      const previous = currentRoom.deckType;
      setRoom({ ...currentRoom, deckType: deck });
      setIsUpdatingDeck(true);
      try {
        await service.updateDeckType(currentRoom.id, deck, currentParticipant.id);
      } catch (error) {
        console.error("Failed to change deck type:", error);
        setRoom({ ...currentRoom, deckType: previous });
      } finally {
        setIsUpdatingDeck(false);
      }
    },
    [currentParticipant, currentRoom, service, setRoom]
  );

  const handleRenameRoom = useCallback(async () => {
    const trimmedName = newRoomName.trim();
    if (!currentRoom || !currentParticipant || !trimmedName) return;
    if (trimmedName === currentRoom.name) return;
    const previous = currentRoom.name;
    setRoom({ ...currentRoom, name: trimmedName });
    setIsRenaming(true);
    try {
      await service.updateRoomName(currentRoom.id, trimmedName, currentParticipant.id);
    } catch (error) {
      console.error("Failed to rename room:", error);
      setRoom({ ...currentRoom, name: previous });
    } finally {
      setIsRenaming(false);
    }
  }, [currentParticipant, currentRoom, newRoomName, service, setRoom]);

  const handleRemoveParticipant = useCallback(
    async (participantId: string) => {
      if (!currentRoom || !currentParticipant) return;
      try {
        await service.kickParticipant(currentRoom.id, participantId, currentParticipant.id);
      } catch (error) {
        console.error("Failed to remove participant:", error);
      }
    },
    [currentRoom, currentParticipant, service]
  );

  const handleUpdateProfile = useCallback(
    async (nextNickname: string, avatar: string) => {
      if (!currentParticipant || !currentRoom) return;
      try {
        await service.updateParticipantProfile(currentParticipant.id, {
          nickname: nextNickname,
          avatar,
        });

        const updatedParticipant = { ...currentParticipant, nickname: nextNickname, avatar };
        setParticipant(updatedParticipant);
        setRoom({
          ...currentRoom,
          participants: currentRoom.participants.map((p) =>
            p.id === updatedParticipant.id ? { ...p, nickname: nextNickname, avatar } : p
          ),
        });
        setShowProfileEdit(false);
      } catch (error) {
        console.error("Failed to update profile:", error);
        throw error;
      }
    },
    [currentParticipant, currentRoom, service, setParticipant, setRoom]
  );

  const handleJoinFromLink = async () => {
    if (!nickname.trim()) {
      setJoinError(t("errors.nicknameRequired"));
      return;
    }

    if (!roomId) {
      navigate("/");
      return;
    }

    setIsJoining(true);
    setJoinError("");

    try {
      const finalPassword = needsPassword ? joinModalPassword.trim() : undefined;
      if (needsPassword && !finalPassword) {
        setJoinError(t("errors.passwordRequired"));
        setIsJoining(false);
        return;
      }

      const { room, participant } = await service.joinRoom({
        roomId,
        participantNickname: nickname.trim(),
        avatar: joinModalAvatar,
        password: finalPassword,
        isSpectator: joinAsSpectator,
      });
      setRoom(room);
      setParticipant(participant);
      setShowJoinModal(false);
      setJoinModalPassword("");
    } catch (error) {
      console.error("Failed to join room:", error);
      if ((error as any).message === "Invalid password") {
        setJoinError(t("errors.invalidPassword"));
      } else {
        setJoinError(t("errors.roomNotFound"));
      }
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (!currentRoom?.isRevealed) return;

    const activeVoters = currentRoom.participants.filter((p) => !p.isSpectator);
    const allHaveVote =
      activeVoters.length > 0 &&
      activeVoters.every((p) => p.vote !== null && p.vote !== undefined);
    const firstVote = allHaveVote ? activeVoters[0].vote : null;
    const allSame = allHaveVote && activeVoters.every((p) => p.vote === firstVote);

    if (allSame && !confettiPlayed) {
      triggerConfetti();
      setConfettiPlayed(true);
    }
  }, [confettiPlayed, currentRoom, triggerConfetti]);

  useEffect(() => {
    if (!currentRoom?.isRevealed) {
      setConfettiPlayed(false);
    }
  }, [currentRoom?.isRevealed]);

  useEffect(() => {
    if (currentRoom?.name) {
      setNewRoomName(currentRoom.name);
    }
  }, [currentRoom?.name]);

  useEffect(() => {
    if (!showSettingsMenu && !showMobileMenu) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        settingsRef.current &&
        event.target instanceof Node &&
        !settingsRef.current.contains(event.target)
      ) {
        setShowSettingsMenu(false);
      }
      if (
        mobileMenuRef.current &&
        event.target instanceof Node &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [settingsRef, mobileMenuRef, showSettingsMenu, showMobileMenu]);

  useEffect(() => {
    if (!roomId || !currentParticipant?.id) return;

    const channel = service.subscribeToRoom(
      roomId,
      currentParticipant.id,
      (room) => {
        // Apply presence state to participants
        const updatedRoom = {
          ...room,
          participants: room.participants.map((p) => ({
            ...p,
            isOnline: onlineParticipantIdsRef.current.has(p.id),
          })),
        };
        setRoom(updatedRoom);

        const updated = updatedRoom.participants.find((p) => p.id === currentParticipant.id);
        if (updated) {
          setParticipant(updated);
        }
      },
      (onlineIds) => {
        // Update online participant IDs when presence changes
        onlineParticipantIdsRef.current = new Set(onlineIds);
        forceUpdate({});
      }
    );

    return () => {
      service.unsubscribeFromRoom(channel);
    };
  }, [roomId, currentParticipant?.id, service, setParticipant, setRoom]);

  // Fallback sync every 1 minute
  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(async () => {
      try {
        const latest = await service.getRoomWithParticipants(roomId);

        // Apply current presence state
        const updatedRoom = {
          ...latest,
          participants: latest.participants.map((p) => ({
            ...p,
            isOnline: onlineParticipantIdsRef.current.has(p.id),
          })),
        };
        setRoom(updatedRoom);

        const currentParticipantId = useRoomStore.getState().currentParticipant?.id;
        if (currentParticipantId) {
          const updated = updatedRoom.participants.find(
            (p) => p.id === currentParticipantId
          );
          if (updated) {
            setParticipant(updated);
          }
        }
      } catch (err) {
        console.warn("Sync fallback failed", err);
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [roomId, service, setParticipant, setRoom]);

  useEffect(() => {
    if (!currentRoom || !currentParticipant) return;

    const me = currentRoom.participants.find((p) => p.id === currentParticipant.id);
    if (!currentRoom.isRevealed && me && !me.hasVoted) {
      setSelectedVote(null);
    }
  }, [currentParticipant, currentRoom]);

  const canToggleAutoReveal = currentParticipant?.id === currentRoom?.creatorId;
  const canChangeDeck = canToggleAutoReveal;
  const canRename = canToggleAutoReveal;
  const canRemoveParticipants = currentParticipant?.id === currentRoom?.creatorId;

  return {
    currentRoom,
    currentParticipant,
    selectedVote,
    copied,
    showJoinModal,
    nickname,
    joinModalPassword,
    needsPassword,
    isJoining,
    joinError,
    isRecoveringSession,
    joinAsSpectator,
    joinModalAvatar,
    confettiPlayed,
    showEveryoneVoted,
    revealCountdown,
    isTogglingAutoReveal,
    isUpdatingDeck,
    showSettingsMenu,
    showMobileMenu,
    newRoomName,
    isRenaming,
    showProfileEdit,
    deckConfig,
    numericVoteOptions,
    specialVoteOptions,
    voters,
    averageVote,
    allVoted,
    votedCount,
    totalVoters,
    isRevealingSoon,
    canToggleAutoReveal,
    canChangeDeck,
    canRename,
    canRemoveParticipants,
    settingsRef,
    mobileMenuRef,
    setSelectedVote,
    setCopied,
    setShowJoinModal,
    setNickname,
    setJoinModalPassword,
    setNeedsPassword,
    setIsJoining,
    setJoinError,
    setJoinAsSpectator,
    setJoinModalAvatar,
    setConfettiPlayed,
    setAutoRevealTriggered,
    setShowEveryoneVoted,
    setRevealCountdown,
    setIsTogglingAutoReveal,
    setIsUpdatingDeck,
    setShowSettingsMenu,
    setShowMobileMenu,
    setNewRoomName,
    setIsRenaming,
    setShowProfileEdit,
    handleReveal,
    startRevealCountdown,
    handleVote,
    handleReset,
    handleLeave,
    handleCopyLink,
    handleToggleAutoReveal,
    handleDeckChange,
    handleRenameRoom,
    handleRemoveParticipant,
    handleUpdateProfile,
    handleJoinFromLink,
  };
}
