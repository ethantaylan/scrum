import { Input } from "../components/ui/Input";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { LanguageToggle } from "../components/ui/LanguageToggle";
import { VotingCard } from "../components/VotingCard";
import { ParticipantCard } from "../components/ParticipantCard";
import { useSupabase } from "../hooks/useSupabase";
import {
  useRoomStore,
  getStoredSession,
  getLastNickname,
  getLastAvatar,
} from "../stores/room.store";
import { DECKS, DECK_OPTIONS, EMOJI_AVATARS } from "../constants/decks";
import type { VoteValue, DeckType } from "../types";
import { supabaseService } from "../services/supabase.service";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "../+types/root";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Scrum Poker - Room ${params.id}` },
    { name: "description", content: "Real-time scrum poker voting room" },
  ];
}

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const supabase = useSupabase();
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
  const [joinRoomName, setJoinRoomName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [isRecoveringSession, setIsRecoveringSession] = useState(true);
  const defaultAvatar =
    (typeof window !== "undefined" && getLastAvatar()) || EMOJI_AVATARS[0];
  const [confettiPlayed, setConfettiPlayed] = useState(false);
  const [autoRevealTriggered, setAutoRevealTriggered] = useState(false);
  const [showEveryoneVoted, setShowEveryoneVoted] = useState(false);
  const [isTogglingAutoReveal, setIsTogglingAutoReveal] = useState(false);
  const [isUpdatingDeck, setIsUpdatingDeck] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

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
  const parseVoteToNumber = (vote: VoteValue | null) => {
    if (!vote) return null;
    const cleaned =
      typeof vote === "string" && vote.endsWith("h") ? vote.slice(0, -1) : vote;
    const numeric = Number.parseFloat(cleaned);
    return Number.isNaN(numeric) ? null : numeric;
  };
  const averageVote = useMemo(() => {
    if (!currentRoom?.isRevealed) return null;

    const numericVotes = voters
      .filter((p) => p.hasVoted && p.vote !== null)
      .map((p) => parseVoteToNumber(p.vote))
      .filter((v): v is number => v !== null);

    if (!numericVotes.length) return null;
    const sum = numericVotes.reduce((a, b) => a + b, 0);
    return Number((sum / numericVotes.length).toFixed(2));
  }, [currentRoom?.isRevealed, voters]);

  const handleReveal = useCallback(async () => {
    if (!currentRoom) return;
    setRoom({ ...currentRoom, isRevealed: true });
    try {
      await supabase.revealVotes(currentRoom.id);
    } catch (error) {
      console.error("Failed to reveal votes:", error);
    }
  }, [currentRoom, setRoom, supabase]);

  const votedCount = voters.filter((p) => p.hasVoted).length;
  const totalVoters = voters.length;

  const allVoted = voters.length > 0 && voters.every((p) => p.hasVoted);

  // Pre-fill nickname with last used nickname
  useEffect(() => {
    const lastNickname = getLastNickname();
    if (lastNickname) {
      setNickname(lastNickname);
    }
  }, []);

  // Attempt to recover session on mount
  useEffect(() => {
    const recoverSession = async () => {
      const storedSession = getStoredSession();

      // If we have a stored session and it matches the current room ID, try to reconnect
      if (storedSession && storedSession.roomId === id) {
        try {
          // Try to reconnect to existing participant (doesn't create duplicate)
          const result = await supabase.reconnectToRoom(
            storedSession.roomId,
            storedSession.participantId
          );

          if (result) {
            // Successfully reconnected to existing participant
            setRoom(result.room);
            setParticipant(result.participant);
            setShowJoinModal(false);
          } else {
            // Participant no longer exists (maybe kicked or room ended), show join modal
            setShowJoinModal(true);
          }
        } catch (error) {
          console.error("Failed to recover session:", error);
          // Session recovery failed, show join modal
          setShowJoinModal(true);
        }
      } else {
        // No valid session, show join modal
        setShowJoinModal(true);
      }

      setIsRecoveringSession(false);
    };

    // Only attempt recovery if not already in a room
    if (!currentRoom || !currentParticipant) {
      recoverSession();
    } else {
      setIsRecoveringSession(false);
    }
  }, [id, supabase, currentRoom, currentParticipant, setRoom, setParticipant]);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      if (!id || !showJoinModal) return;
      try {
        const info = await supabase.getRoomInfo(id);
        setNeedsPassword(info.hasPassword);
        setJoinRoomName(info.name);
      } catch {
        setNeedsPassword(false);
      }
    };

    fetchRoomInfo();
  }, [id, showJoinModal, supabase]);

  // Update participant status when component mounts/unmounts (stable on id)
  // Keep current user marked online (heartbeat) and mark offline on leave
  useEffect(() => {
    if (!currentParticipant?.id) return;

    const goOnline = async () => {
      try {
        await supabase.updateParticipantStatus(currentParticipant.id, true);
      } catch (err) {
        console.warn("Unable to update status online", err);
      }
    };

    goOnline();
    const heartbeat = setInterval(goOnline, 15000);

    return () => {
      clearInterval(heartbeat);
      supabase
        .updateParticipantStatus(currentParticipant.id, false)
        .catch(() => {});
    };
  }, [currentParticipant?.id]);

  useEffect(() => {
    if (!currentRoom) return;

    if (currentRoom.isRevealed) {
      setShowEveryoneVoted(false);
      setAutoRevealTriggered(false);
      return;
    }

    if (allVoted) {
      setShowEveryoneVoted(true);

      if (currentRoom.autoReveal && !autoRevealTriggered) {
        setAutoRevealTriggered(true);
        handleReveal();
      }
    } else {
      setShowEveryoneVoted(false);
      setAutoRevealTriggered(false);
    }
  }, [allVoted, autoRevealTriggered, currentRoom, handleReveal]);

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
      await supabase.castVote(currentParticipant.id, vote);
    } catch (error) {
      console.error("Failed to cast vote:", error);
    }
  };

  const handleReset = useCallback(async () => {
    if (!currentRoom) return;
    setSelectedVote(null);
    setShowEveryoneVoted(false);
    setAutoRevealTriggered(false);
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
      await supabase.resetVotes(currentRoom.id);
    } catch (error) {
      console.error("Failed to reset votes:", error);
    }
  }, [currentRoom, setRoom, supabase]);

  const handleLeave = async () => {
    if (!currentRoom || !currentParticipant) return;
    try {
      await supabase.leaveRoom(currentRoom.id, currentParticipant.id);
      clearRoom();
      navigate("/");
    } catch (error) {
      console.error("Failed to leave room:", error);
      clearRoom();
      navigate("/");
    }
  };

  const handleCopyLink = useCallback(async () => {
    const roomIdToCopy = currentRoom?.id || id || "";
    if (!roomIdToCopy) return;
    try {
      await navigator.clipboard.writeText(roomIdToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy room id:", err);
    }
  }, [currentRoom?.id, id]);

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
      await supabase.toggleAutoReveal(
        currentRoom.id,
        next,
        currentParticipant.id
      );
    } catch (error) {
      console.error("Failed to toggle auto reveal:", error);
      setRoom({ ...currentRoom, autoReveal: previous });
    } finally {
      setIsTogglingAutoReveal(false);
    }
  }, [currentParticipant, currentRoom, supabase]);

  const handleDeckChange = useCallback(
    async (deck: DeckType) => {
      if (!currentRoom || !currentParticipant) return;
      const previous = currentRoom.deckType;
      setRoom({ ...currentRoom, deckType: deck });
      setIsUpdatingDeck(true);
      try {
        await supabase.updateDeckType(
          currentRoom.id,
          deck,
          currentParticipant.id
        );
      } catch (error) {
        console.error("Failed to change deck type:", error);
        setRoom({ ...currentRoom, deckType: previous });
      } finally {
        setIsUpdatingDeck(false);
      }
    },
    [currentParticipant, currentRoom, supabase]
  );

  const handleRenameRoom = useCallback(async () => {
    const trimmedName = newRoomName.trim();
    if (!currentRoom || !currentParticipant || !trimmedName) return;
    if (trimmedName === currentRoom.name) return;
    const previous = currentRoom.name;
    setRoom({ ...currentRoom, name: trimmedName });
    setIsRenaming(true);
    try {
      await supabase.updateRoomName(
        currentRoom.id,
        trimmedName,
        currentParticipant.id
      );
    } catch (error) {
      console.error("Failed to rename room:", error);
      setRoom({ ...currentRoom, name: previous });
    } finally {
      setIsRenaming(false);
    }
  }, [currentParticipant, currentRoom, newRoomName, supabase]);

  const handleJoinFromLink = async () => {
    if (!nickname.trim()) {
      setJoinError(t("errors.nicknameRequired"));
      return;
    }

    if (!id) {
      navigate("/");
      return;
    }

    setIsJoining(true);
    setJoinError("");

    try {
      const finalPassword = needsPassword
        ? joinModalPassword.trim()
        : undefined;
      if (needsPassword && !finalPassword) {
        setJoinError(t("errors.passwordRequired"));
        setIsJoining(false);
        return;
      }

      const { room, participant } = await supabase.joinRoom({
        roomId: id,
        participantNickname: nickname.trim(),
        avatar: defaultAvatar,
        password: finalPassword,
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

    const voters = currentRoom.participants.filter((p) => !p.isSpectator);
    const allHaveVote =
      voters.length > 0 &&
      voters.every((p) => p.vote !== null && p.vote !== undefined);
    const firstVote = allHaveVote ? voters[0].vote : null;
    const allSame = allHaveVote && voters.every((p) => p.vote === firstVote);

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
    if (!showSettingsMenu) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        settingsRef.current &&
        event.target instanceof Node &&
        !settingsRef.current.contains(event.target)
      ) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [settingsRef, showSettingsMenu]);

  // Keep realtime sync alive - only depends on room ID to avoid feedback loops
  useEffect(() => {
    if (!id) return;

    const channel = supabaseService.subscribeToRoom(id, (room) => {
      // Trust the database state - don't force online status
      setRoom(room);

      // Update current participant if they exist in the room data
      const currentParticipantId =
        useRoomStore.getState().currentParticipant?.id;
      if (currentParticipantId) {
        const updated = room.participants.find(
          (p) => p.id === currentParticipantId
        );
        if (updated) {
          setParticipant(updated);
        }
      }
    });

    return () => {
      supabaseService.unsubscribeFromRoom(channel);
    };
  }, [id, setParticipant, setRoom]);

  // Fallback polling to guarantee UI stays in sync if realtime stalls
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const latest = await supabaseService.getRoomWithParticipants(id);
        // Trust the database state - don't force online status
        setRoom(latest);

        const currentParticipantId =
          useRoomStore.getState().currentParticipant?.id;
        if (currentParticipantId) {
          const updated = latest.participants.find(
            (p) => p.id === currentParticipantId
          );
          if (updated) {
            setParticipant(updated);
          }
        }
      } catch (err) {
        console.warn("Sync fallback failed", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [id, setParticipant, setRoom]);

  useEffect(() => {
    if (!currentRoom || !currentParticipant) return;

    const me = currentRoom.participants.find(
      (p) => p.id === currentParticipant.id
    );
    if (!currentRoom.isRevealed && me && !me.hasVoted) {
      setSelectedVote(null);
    }
  }, [currentParticipant, currentRoom]);

  // Show loading while recovering session
  if (isRecoveringSession) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t("room.loading")}
          </p>
        </div>
      </div>
    );
  }

  // Show join modal when user lands on room link without being in the room
  if (showJoinModal && (!currentRoom || !currentParticipant)) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t("home.joinRoom")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t("home.enterNickname")}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label={t("home.enterNickname")}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleJoinFromLink();
                }
              }}
              error={!needsPassword ? joinError : undefined}
              placeholder="John Doe"
              maxLength={20}
              autoFocus
            />

            {needsPassword && (
              <Input
                label={t("home.password")}
                type="password"
                value={joinModalPassword}
                onChange={(e) => {
                  setJoinModalPassword(e.target.value);
                  setJoinError("");
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleJoinFromLink();
                  }
                }}
                error={joinError}
                placeholder={t("home.passwordPlaceholder")}
                maxLength={50}
              />
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onClick={() => navigate("/")}
              >
                {t("home.cancel")}
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleJoinFromLink}
                disabled={!nickname.trim() || isJoining}
              >
                {isJoining ? t("home.joining") : t("home.join")}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentRoom || !currentParticipant) {
    return null;
  }

  const canToggleAutoReveal = currentParticipant.id === currentRoom.creatorId;
  const canChangeDeck = canToggleAutoReveal;
  const canRename = canToggleAutoReveal;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentRoom.name}
              </h1>
              {currentRoom.autoReveal && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700">
                  {t("room.autoRevealBadge")}
                </span>
              )}
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{t("room.roomId")}:</span>
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                  {currentRoom.id}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLink}
                  className="!p-1.5"
                >
                  {copied ? (
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" ref={settingsRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettingsMenu((v) => !v)}
                  className="!px-2"
                  aria-label={t("room.settings")}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.607 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </Button>
                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t("room.settings")}
                      </span>
                      <button
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        onClick={() => setShowSettingsMenu(false)}
                        aria-label={t("room.settings")}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          {t("settings.roomName")}
                        </label>
                        <div className="relative">
                          <input
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleRenameRoom();
                              }
                            }}
                            disabled={!canRename}
                            className="w-full pr-20 pl-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="xs"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 text-sm"
                            onClick={handleRenameRoom}
                            disabled={
                              !canRename ||
                              isRenaming ||
                              !newRoomName.trim() ||
                              newRoomName.trim() === currentRoom.name
                            }
                          >
                            {isRenaming ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          {t("home.deckType")}
                        </label>
                        <select
                          value={currentRoom.deckType}
                          onChange={(e) =>
                            handleDeckChange(e.target.value as DeckType)
                          }
                          disabled={!canChangeDeck || isUpdatingDeck}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                        >
                          {DECK_OPTIONS.map((deck) => (
                            <option key={deck.type} value={deck.type}>
                              {t(`decks.${deck.type}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        variant="primary"
                        fullWidth
                        className={`justify-center font-semibold shadow-sm ${
                          currentRoom.autoReveal
                            ? "bg-blue-700 hover:bg-blue-800 text-white"
                            : "bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                        }`}
                        onClick={handleToggleAutoReveal}
                        disabled={!canToggleAutoReveal || isTogglingAutoReveal}
                        title={
                          canToggleAutoReveal
                            ? ""
                            : t("room.autoRevealCreatorOnly")
                        }
                      >
                        {currentRoom.autoReveal
                          ? t("room.autoRevealOn")
                          : t("room.autoRevealOff")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <LanguageToggle />
              <ThemeToggle />
              <Button variant="danger" size="sm" onClick={handleLeave}>
                {t("room.leave")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Voting Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Voting Status */}
            <Card variant="bordered" className="p-6">
              {showEveryoneVoted && (
                <div className="mb-4 p-3 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                      {t("room.everyoneVoted")}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {currentRoom.autoReveal
                        ? t("room.autoRevealNotice")
                        : t("room.revealHint")}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white"></h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {votedCount} / {totalVoters} {t("room.hasVoted")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!currentRoom.isRevealed &&
                    !currentParticipant.isSpectator &&
                    totalVoters > 0 && (
                      <Button variant="primary" onClick={handleReveal}>
                        {t("room.reveal")}
                      </Button>
                    )}
                  {currentRoom.isRevealed && (
                    <Button variant="secondary" onClick={handleReset}>
                      {t("room.newRound")}
                    </Button>
                  )}
                </div>
              </div>

              {/* Voting Progress */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0}%`,
                  }}
                />
              </div>

              {currentRoom.isRevealed && averageVote !== null && (
                <div className="mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {t("voting.average")}
                  </span>
                  <span className="text-xl font-bold text-blue-700 dark:text-blue-200">
                    {averageVote}
                  </span>
                </div>
              )}

              {/* Voting Cards */}
              {!currentRoom.isRevealed && !currentParticipant.isSpectator && (
                <div className="space-y-4">
                  {/* Numeric votes */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    {numericVoteOptions.map((value) => (
                      <VotingCard
                        key={value}
                        value={value}
                        isSelected={selectedVote === value}
                        onClick={() => handleVote(value)}
                        disabled={currentRoom.isRevealed}
                      />
                    ))}
                  </div>

                  {/* Special votes */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    {specialVoteOptions.map((value) => (
                      <VotingCard
                        key={value}
                        value={value}
                        isSelected={selectedVote === value}
                        onClick={() => handleVote(value)}
                        disabled={currentRoom.isRevealed}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Spectator Message */}
              {!currentRoom.isRevealed && currentParticipant.isSpectator && (
                <div className="p-8 text-center bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-4xl mb-3">👀</div>
                  <p className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-1">
                    Spectator Mode
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    You're watching this session. You can't vote.
                  </p>
                </div>
              )}

              {/* Current Vote Display */}
              {selectedVote && !currentRoom.isRevealed && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t("room.youVoted")}
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedVote}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Participants Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {t("room.participants")} ({currentRoom.participants.length})
              </h3>
              <div className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
                {currentRoom.participants
                  .sort((a, b) => {
                    if (a.id === currentParticipant.id) return -1;
                    if (b.id === currentParticipant.id) return 1;
                    return a.nickname.localeCompare(b.nickname);
                  })
                  .map((participant) => (
                    <ParticipantCard
                      key={participant.id}
                      participant={participant}
                      isRevealed={currentRoom.isRevealed}
                      isCurrentUser={participant.id === currentParticipant.id}
                    />
                  ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
