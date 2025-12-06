import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/home";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { LanguageToggle } from "../components/ui/LanguageToggle";
import { useSupabase } from "../hooks/useSupabase";
import { useRoomStore } from "../stores/room.store";

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
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [errors, setErrors] = useState<{
    nickname?: string;
    roomId?: string;
    roomName?: string;
  }>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateNickname = () => {
    if (!nickname.trim()) {
      setErrors((prev) => ({
        ...prev,
        nickname: t("errors.nicknameRequired"),
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, nickname: undefined }));
    return true;
  };

  const handleCreateRoom = async () => {
    if (!validateNickname()) return;

    setIsLoading(true);
    try {
      const finalRoomName = roomName.trim() || `${nickname}'s Room`;
      const { room, participant } = await supabase.createRoom(
        finalRoomName,
        nickname.trim()
      );

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

  const handleJoinRoom = async () => {
    if (!validateNickname()) return;

    if (!roomId.trim()) {
      setErrors((prev) => ({ ...prev, roomId: t("errors.roomIdRequired") }));
      return;
    }

    setIsLoading(true);
    try {
      setErrors((prev) => ({ ...prev, roomId: undefined }));
      const { room, participant } = await supabase.joinRoom(
        roomId.trim(),
        nickname.trim()
      );

      setRoom(room);
      setParticipant(participant);
      navigate(`/room/${room.id}`);
    } catch (error) {
      console.error("Failed to join room:", error);
      setErrors((prev) => ({ ...prev, roomId: t("errors.roomNotFound") }));
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
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            {t("app.title")}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t("app.subtitle")}
          </p>
        </div>

        {/* Main Card */}
        <Card variant="elevated" className="w-full max-w-md p-8">
          <div className="space-y-6">
            {/* Nickname Input - Always visible */}
            <div>
              <Input
                label={t("home.enterNickname")}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onBlur={validateNickname}
                error={errors.nickname}
                placeholder="John Doe"
                maxLength={20}
              />
            </div>

            {/* Toggle Mode Buttons */}
            {!isCreating && (
              <div className="space-y-4">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => setIsCreating(true)}
                >
                  {t("home.createRoom")}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                      {t("home.or")}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    label={t("home.enterRoomId")}
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    error={errors.roomId}
                    placeholder="abc-123-xyz"
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={handleJoinRoom}
                    disabled={!nickname.trim() || !roomId.trim() || isLoading}
                  >
                    {isLoading ? "Joining..." : t("home.joinRoom")}
                  </Button>
                </div>
              </div>
            )}

            {/* Create Room Mode */}
            {isCreating && (
              <div className="space-y-4">
                <Input
                  label={t("home.roomName")}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={t("home.roomName")}
                  maxLength={30}
                />

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      setIsCreating(false);
                      setRoomName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleCreateRoom}
                    disabled={!nickname.trim() || isLoading}
                  >
                    {isLoading ? "Creating..." : t("home.start")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

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
