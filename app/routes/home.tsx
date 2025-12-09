import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/home";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { LanguageToggle } from "../components/ui/LanguageToggle";
import { CompactAvatarSelector } from "../components/ui/CompactAvatarSelector";
import { useSupabase } from "../hooks/useSupabase";
import {
  useRoomStore,
  getLastNickname,
  getLastAvatar,
} from "../stores/room.store";
import { EMOJI_AVATARS } from "../constants/decks";
import type { DeckType } from "../types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Scrum Poker - Vote together, estimate better" },
    { name: "description", content: "Real-time scrum poker planning tool" },
  ];
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const { setRoom, setParticipant } = useRoomStore();
  const DEFAULT_AVATAR = EMOJI_AVATARS[0];
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [deckType] = useState<DeckType>("fibonacci");
  const [createPassword] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const autoReveal = false;
  const [isSpectator, setIsSpectator] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingRoomInfo, setPendingRoomInfo] = useState<{
    id: string;
    name: string;
    hasPassword: boolean;
  } | null>(null);
  const [errors, setErrors] = useState<{
    nickname?: string;
    roomId?: string;
    roomName?: string;
    password?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill nickname + avatar from localStorage
  useEffect(() => {
    const lastNickname = getLastNickname();
    const lastAvatar = getLastAvatar();

    if (lastNickname) {
      setNickname(lastNickname);
    }

    if (lastAvatar) {
      setAvatar(lastAvatar);
    }
  }, []);

  const handleAvatarSelect = (value: string) => {
    setAvatar(value);
    try {
      localStorage.setItem("scrum-last-avatar", value);
    } catch (err) {
      console.warn("Unable to persist avatar", err);
    }
  };

  const handleCreateRoom = async () => {
    // Validate nickname
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
      const { room, participant } = await supabase.createRoom({
        roomName: finalRoomName,
        participantNickname: nickname.trim(),
        avatar,
        deckType,
        password: createPassword.trim() || undefined,
        autoReveal,
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
    // Validate nickname
    if (!nickname.trim()) {
      setErrors((prev) => ({
        ...prev,
        nickname: t("errors.nicknameRequired"),
      }));
      return;
    }

    // Validate room ID
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

      const roomInfo = await supabase.getRoomInfo(trimmedId);
      const finalPassword = passwordOverride ?? joinPassword.trim();

      if (roomInfo.hasPassword && !finalPassword) {
        setPendingRoomInfo(roomInfo);
        setShowPasswordPrompt(true);
        setIsLoading(false);
        return;
      }

      const { room, participant } = await supabase.joinRoom({
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

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Header */}
      <header className="p-4 flex justify-end items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
            {t("app.title")}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t("app.subtitle")}
          </p>
        </div>

        {/* Main Card */}
        <Card variant="elevated" className="w-full max-w-lg">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setActiveTab("create");
                setErrors({});
                setIsAdvancedOpen(false);
              }}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "create"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t("home.createRoom")}
            </button>
            <button
              onClick={() => {
                setActiveTab("join");
                setErrors({});
                setIsAdvancedOpen(false);
              }}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "join"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t("home.joinRoom")}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Essential Fields - Always Visible */}
            <div className="flex items-end gap-4 mb-6">
              <CompactAvatarSelector
                selectedAvatar={avatar}
                onSelect={handleAvatarSelect}
              />
              <div className="flex-1">
                <Input
                  label={t("home.enterNickname")}
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setErrors((prev) => ({ ...prev, nickname: undefined }));
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && nickname.trim() && !isLoading) {
                      if (activeTab === "create") {
                        handleCreateRoom();
                      } else if (roomId.trim()) {
                        handleJoinRoom();
                      }
                    }
                  }}
                  error={errors.nickname}
                  placeholder="John Doe"
                  maxLength={20}
                  autoFocus
                />
              </div>
            </div>

            {/* Create Room Tab */}
            {activeTab === "create" && (
              <div className="space-y-6">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleCreateRoom}
                  disabled={!nickname.trim() || isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {t("home.creating")}
                    </span>
                  ) : (
                    t("home.createRoom")
                  )}
                </Button>
              </div>
            )}

            {/* Join Room Tab */}
            {activeTab === "join" && (
              <div className="space-y-6">
                <Input
                  label={t("home.enterRoomId")}
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    setErrors((prev) => ({ ...prev, roomId: undefined }));
                  }}
                  error={errors.roomId}
                  placeholder="abc-123-xyz"
                />

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => handleJoinRoom()}
                  disabled={!nickname.trim() || !roomId.trim() || isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {t("home.joining")}
                    </span>
                  ) : (
                    t("home.joinRoom")
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
        {showPasswordPrompt && pendingRoomInfo && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => {
                setShowPasswordPrompt(false);
                setJoinPassword("");
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Card variant="elevated" className="w-full max-w-md relative p-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setJoinPassword("");
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={t("home.cancel")}
                >
                  <svg
                    className="w-5 h-5"
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

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t("home.passwordModalTitle")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t("home.passwordModalSubtitle", {
                    roomName: pendingRoomInfo.name,
                  })}
                </p>

                <div className="mt-4 space-y-4">
                  <Input
                    label={t("home.password")}
                    type="password"
                    value={joinPassword}
                    onChange={(e) => {
                      setJoinPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleJoinRoom(joinPassword);
                      }
                    }}
                    error={errors.password}
                    placeholder={t("home.passwordPlaceholder")}
                    maxLength={50}
                    autoFocus
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowPasswordPrompt(false);
                        setJoinPassword("");
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      disabled={isLoading}
                    >
                      {t("home.cancel")}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleJoinRoom(joinPassword)}
                      disabled={!joinPassword.trim() || isLoading}
                    >
                      {isLoading ? t("home.joining") : t("home.submitPassword")}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <Card variant="bordered" className="p-6 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Real-time
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Instant vote updates for all participants
            </p>
          </Card>
          <Card variant="bordered" className="p-6 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Simple
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No registration required, just enter and vote
            </p>
          </Card>
          <Card variant="bordered" className="p-6 text-center">
            <div className="text-3xl mb-2">🌍</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Multilingual
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Available in English and French
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
