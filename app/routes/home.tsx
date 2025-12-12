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
    { title: "Vote together, estimate better" },
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
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors">
      {/* Header */}
      <header className="absolute top-0 right-0 p-4 sm:p-6 flex items-center gap-2 z-10">
        <LanguageToggle />
        <ThemeToggle />
      </header>

      {/* Main Content - Hero + Login Side by Side */}
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative">
            {/* Hero Section */}
            <div className="text-center lg:text-left animate-fade-in">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                <span dangerouslySetInnerHTML={{ __html: t("home.heroTitle", { value: "<br />" }) }} />
                </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0">
                {t("home.heroSubtitle")}
              </p>

              {/* Features - Compact Version */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                  <div className="text-2xl">⚡</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t("home.featureRealtime")}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 hidden lg:block">
                      {t("home.featureRealtimeDesc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t("home.featureSimple")}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 hidden lg:block">
                      {t("home.featureSimpleDesc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                  <div className="text-2xl">🌍</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t("home.featureMultilingual")}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 hidden lg:block">
                      {t("home.featureMultilingualDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Separator - Hidden on mobile, visible on desktop */}
            <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3/4 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>

            {/* Login Card */}
            <Card
              variant="elevated"
              className="w-full max-w-md mx-auto shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5 backdrop-blur-sm"
            >
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setActiveTab("create");
                    setErrors({});
                  }}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                    activeTab === "create"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {t("home.createRoom")}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("join");
                    setErrors({});
                  }}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                    activeTab === "join"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {t("home.joinRoom")}
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 sm:p-8">
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
                        if (
                          e.key === "Enter" &&
                          nickname.trim() &&
                          !isLoading
                        ) {
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
          </div>
        </div>
      </div>

      {/* Password Prompt Modal */}
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
    </div>
  );
}
