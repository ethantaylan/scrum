import { useTranslation } from "react-i18next";
import type { Route } from "./+types/home";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { LanguageToggle } from "../components/ui/LanguageToggle";
import { CompactAvatarSelector } from "../components/ui/CompactAvatarSelector";
import { useHomeController } from "../features/home/useHomeController";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Vote together, estimate better" },
    { name: "description", content: "Real-time scrum poker planning tool" },
  ];
}

export default function Home() {
  const { t } = useTranslation();
  const { state, modals, flags, errors, actions } = useHomeController(t);

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
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
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
                    actions.setActiveTab("create");
                    actions.resetErrors();
                  }}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                    state.activeTab === "create"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {t("home.createRoom")}
                </button>
                <button
                  onClick={() => {
                    actions.setActiveTab("join");
                    actions.resetErrors();
                  }}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                    state.activeTab === "join"
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
                    selectedAvatar={state.avatar}
                    onSelect={actions.handleAvatarSelect}
                  />
                  <div className="flex-1">
                    <Input
                      label={t("home.enterNickname")}
                      value={state.nickname}
                      onChange={(e) => {
                        actions.setNickname(e.target.value);
                        actions.clearError("nickname");
                      }}
                      onKeyPress={(e) => {
                        if (
                          e.key === "Enter" &&
                          state.nickname.trim() &&
                          !flags.isLoading
                        ) {
                          if (state.activeTab === "create") {
                            actions.handleCreateRoom();
                          } else if (state.roomId.trim()) {
                            actions.handleJoinRoom();
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
                {state.activeTab === "create" && (
                  <div className="space-y-6">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={actions.handleCreateRoom}
                      disabled={!state.nickname.trim() || flags.isLoading}
                    >
                      {flags.isLoading ? (
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
                {state.activeTab === "join" && (
                  <div className="space-y-6">
                    <Input
                      label={t("home.enterRoomId")}
                      value={state.roomId}
                      onChange={(e) => {
                        actions.setRoomId(e.target.value);
                        actions.clearError("roomId");
                      }}
                      error={errors.roomId}
                      placeholder="abc-123-xyz"
                    />

                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => actions.handleJoinRoom()}
                      disabled={!state.nickname.trim() || !state.roomId.trim() || flags.isLoading}
                    >
                      {flags.isLoading ? (
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

      {/* Active Session Prompt Modal */}
      {modals.showSessionPrompt && modals.activeSession && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => actions.setShowSessionPrompt(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card variant="elevated" className="w-full max-w-md relative p-6">
              <button
                type="button"
                onClick={() => actions.setShowSessionPrompt(false)}
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

              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("home.activeSessionTitle")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t("home.activeSessionSubtitle", {
                      roomName: modals.activeSession.roomName,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    actions.setShowSessionPrompt(false);
                    actions.setActiveSession(null);
                  }}
                  disabled={flags.isLoading}
                >
                  {t("home.stayHere")}
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={actions.handleResumeSession}
                  disabled={flags.isLoading}
                >
                  {flags.isLoading ? t("home.joining") : t("home.rejoinRoom")}
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Password Prompt Modal */}
      {modals.showPasswordPrompt && modals.pendingRoomInfo && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={actions.handleDismissPasswordPrompt}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card variant="elevated" className="w-full max-w-md relative p-6">
              <button
                type="button"
                onClick={actions.handleDismissPasswordPrompt}
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
                  roomName: modals.pendingRoomInfo.name,
                })}
              </p>

              <div className="mt-4 space-y-4">
                <Input
                  label={t("home.password")}
                  type="password"
                  value={modals.joinPassword}
                  onChange={(e) => {
                    actions.setJoinPassword(e.target.value);
                    actions.clearError("password");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      actions.handleJoinRoom(modals.joinPassword);
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
                    onClick={actions.handleDismissPasswordPrompt}
                    disabled={flags.isLoading}
                  >
                    {t("home.cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => actions.handleJoinRoom(modals.joinPassword)}
                    disabled={!modals.joinPassword.trim() || flags.isLoading}
                  >
                    {flags.isLoading ? t("home.joining") : t("home.submitPassword")}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="absolute bottom-0 w-full py-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          {t("home.madeBy")}{" "}
          <a
            href="https://github.com/ethantaylan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            ethantaylan
          </a>
        </p>
      </footer>
    </div>
  );
}
