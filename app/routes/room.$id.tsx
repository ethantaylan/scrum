import { Input } from "../components/ui/Input";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { LanguageToggle } from "../components/ui/LanguageToggle";
import { VotingCard } from "../components/VotingCard";
import { ParticipantCard } from "../components/ParticipantCard";
import { CompactAvatarSelector } from "../components/ui/CompactAvatarSelector";
import { ProfileEditModal } from "../components/ProfileEditModal";
import { KeyboardShortcutsModal } from "../components/KeyboardShortcutsModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { DECK_OPTIONS } from "../constants/decks";
import type { DeckType, Participant } from "../types";
import { parseVoteToNumber } from "../lib/votes";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { Route } from "../+types/root";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useRoomController } from "../features/room/useRoomController";
import { useEffect, useState } from "react";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Scrum Poker - Room ${params.id}` },
    { name: "description", content: "Real-time scrum poker voting room" },
  ];
}

export default function Room() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<Participant | null>(null);

  const {
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
    showEveryoneVoted,
    revealCountdown,
    isTogglingAutoReveal,
    isUpdatingDeck,
    showSettingsMenu,
    showMobileMenu,
    newRoomName,
    isRenaming,
    showProfileEdit,
    numericVoteOptions,
    specialVoteOptions,
    voters,
    averageVote,
    votedCount,
    totalVoters,
    isRevealingSoon,
    canToggleAutoReveal,
    canChangeDeck,
    canRename,
    canRemoveParticipants,
    settingsRef,
    mobileMenuRef,
    handleReset,
    handleLeave,
    handleCopyLink,
    handleToggleAutoReveal,
    handleDeckChange,
    handleRenameRoom,
    handleRemoveParticipant,
    handleUpdateProfile,
    handleJoinFromLink,
    startRevealCountdown,
    handleVote,
    setNickname,
    setJoinModalPassword,
    setJoinError,
    setJoinAsSpectator,
    setJoinModalAvatar,
    setShowProfileEdit,
    setShowSettingsMenu,
    setShowMobileMenu,
    setNewRoomName,
  } = useRoomController({ roomId: id, t });

  // Keyboard shortcuts
  useEffect(() => {
    if (!currentRoom || !currentParticipant || showJoinModal) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ignore if modal is already open
      if (showShortcutsModal || showProfileEdit || showSettingsMenu || showMobileMenu) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ": // Space - Reveal votes
          e.preventDefault();
          if (!currentRoom.isRevealed && totalVoters > 0 && !isRevealingSoon) {
            startRevealCountdown();
          }
          break;
        case "r": // R - New round
          if (currentRoom.isRevealed) {
            handleReset();
          }
          break;
        case "c": // C - Copy link
          handleCopyLink();
          break;
        case "?": // ? - Show shortcuts
          setShowShortcutsModal(true);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [
    currentRoom,
    currentParticipant,
    showJoinModal,
    showShortcutsModal,
    showProfileEdit,
    showSettingsMenu,
    showMobileMenu,
    totalVoters,
    isRevealingSoon,
    startRevealCountdown,
    handleReset,
    handleCopyLink,
  ]);

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
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors flex items-center justify-center p-3 sm:p-4">
        <Card variant="elevated" className="w-full max-w-md p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t("home.joinRoom")}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("home.selectAvatar")}
              </label>
              <CompactAvatarSelector
                selectedAvatar={joinModalAvatar}
                onSelect={setJoinModalAvatar}
              />
            </div>

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

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={joinAsSpectator}
                onChange={(e) => setJoinAsSpectator(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t("home.joinAsSpectator")}
              </span>
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => navigate("/")}
              >
                {t("home.cancel")}
              </Button>
              <Button
                variant="primary"
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

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Room Name + Share + Badge */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {currentRoom.name}
              </h1>
              {/* Share Button - Right after title */}
              <button
                onClick={handleCopyLink}
                className="p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                title={copied ? "Copied!" : "Share room"}
              >
                {copied ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                )}
              </button>
              {currentRoom.autoReveal && (
                <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 whitespace-nowrap">
                  Auto
                </span>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Desktop: Settings + Theme + Language + Leave */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="relative" ref={settingsRef}>
                  <button
                    onClick={() => setShowSettingsMenu((v) => !v)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label={t("room.settings")}
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.607 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  {showSettingsMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 z-50">
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
                            size="sm"
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

              {/* Mobile: Hamburger Menu */}
              <div className="sm:hidden relative" ref={mobileMenuRef}>
              <button
                onClick={() => setShowMobileMenu((v) => !v)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Mobile Menu Dropdown */}
              {showMobileMenu && (
                <div className="fixed inset-x-0 top-[57px] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-[calc(100vh-57px)] overflow-y-auto">
                  <div className="px-4 py-3 space-y-3">
                    {/* Room Info */}
                    <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("room.roomId")}</p>
                      <code className="text-sm text-gray-900 dark:text-white font-mono">{currentRoom.id}</code>
                    </div>

                    {/* Settings Section */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          {t("settings.roomName")}
                        </label>
                        <div className="flex gap-2">
                          <input
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            disabled={!canRename}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRenameRoom}
                            disabled={!canRename || isRenaming || !newRoomName.trim() || newRoomName.trim() === currentRoom.name}
                          >
                            {isRenaming ? "..." : "Save"}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          {t("home.deckType")}
                        </label>
                        <select
                          value={currentRoom.deckType}
                          onChange={(e) => handleDeckChange(e.target.value as DeckType)}
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
                        className={`justify-center ${currentRoom.autoReveal ? "bg-blue-700" : "bg-gray-300 dark:bg-gray-700"}`}
                        onClick={handleToggleAutoReveal}
                        disabled={!canToggleAutoReveal || isTogglingAutoReveal}
                      >
                        {currentRoom.autoReveal ? t("room.autoRevealOn") : t("room.autoRevealOff")}
                      </Button>
                    </div>

                    {/* Theme & Language */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <LanguageToggle />
                      </div>
                      <div className="flex-1">
                        <ThemeToggle />
                      </div>
                    </div>

                    {/* Leave Room */}
                    <Button variant="danger" fullWidth onClick={handleLeave}>
                      {t("room.leave")}
                    </Button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Voting Area */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Voting Status */}
            <Card variant="bordered" className="p-4 sm:p-6">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"></h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {votedCount} / {totalVoters} {t("room.hasVoted")}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {!currentRoom.isRevealed &&
                    !currentParticipant.isSpectator &&
                    totalVoters > 0 &&
                    !isRevealingSoon && (
                      <Button
                        variant="primary"
                        onClick={startRevealCountdown}
                        fullWidth
                        className="sm:w-auto"
                      >
                        {t("room.reveal")}
                      </Button>
                    )}
                  {currentRoom.isRevealed && (
                    <Button variant="secondary" onClick={handleReset} fullWidth className="sm:w-auto">
                      {t("room.newRound")}
                    </Button>
                  )}
                </div>
                {isRevealingSoon && !currentRoom.isRevealed && (
                  <div className="flex justify-end w-full sm:w-auto">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-100 shadow-sm animate-pulse">
                      <span className="text-lg">⏳</span>
                      <span className="text-sm font-semibold">
                        {t("room.revealCountdown", { seconds: revealCountdown ?? 0 })}
                      </span>
                    </div>
                  </div>
                )}
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
                <div className="mb-4 sm:mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 flex items-center justify-between">
                  <span className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-100">
                    {t("voting.average")}
                  </span>
                  <span className="text-2xl sm:text-xl font-bold text-blue-700 dark:text-blue-200">
                    {averageVote}
                  </span>
                </div>
              )}

              {/* Voting Recap */}
              {currentRoom.isRevealed && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                    {t("voting.results")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {voters
                      .filter(p => p.hasVoted && p.vote !== null)
                      .sort((a, b) => {
                        const voteA = parseVoteToNumber(a.vote);
                        const voteB = parseVoteToNumber(b.vote);
                        if (voteA === null && voteB === null) return 0;
                        if (voteA === null) return 1;
                        if (voteB === null) return -1;
                        return voteB - voteA;
                      })
                      .map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-lg shrink-0">{participant.avatar || '👤'}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {participant.nickname}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                              {participant.vote}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Voting Cards */}
              {!currentRoom.isRevealed && !currentParticipant.isSpectator && (
                <div className="space-y-3 sm:space-y-4">
                  {/* Numeric votes */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
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
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
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
                <div className="p-6 sm:p-8 text-center bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-3xl sm:text-4xl mb-3">👀</div>
                  <p className="text-base sm:text-lg font-medium text-purple-900 dark:text-purple-100 mb-1">
                    Spectator Mode
                  </p>
                  <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">
                    You're watching this session. You can't vote.
                  </p>
                </div>
              )}

              {/* Current Vote Display */}
              {selectedVote && !currentRoom.isRevealed && (
                <div className="mt-4 sm:mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t("room.youVoted")}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedVote}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Participants Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" className="p-3 sm:p-4 lg:sticky lg:top-24">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 px-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="uppercase tracking-wide">{t("room.participants")}</span>
                <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800">
                  {currentRoom.participants.length}
                </span>
              </h3>
              <div className="space-y-1.5 max-h-[400px] lg:max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
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
                      canRemove={canRemoveParticipants}
                      onRemove={() => setParticipantToRemove(participant)}
                      onEdit={participant.id === currentParticipant.id ? () => setShowProfileEdit(true) : undefined}
                    />
                  ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {showProfileEdit && currentParticipant && (
        <ProfileEditModal
          currentNickname={currentParticipant.nickname}
          currentAvatar={currentParticipant.avatar}
          onSave={handleUpdateProfile}
          onCancel={() => setShowProfileEdit(false)}
        />
      )}

      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}

      {participantToRemove && (
        <ConfirmModal
          title={t("settings.confirmKickTitle")}
          message={t("settings.confirmKickMessage", { nickname: participantToRemove.nickname })}
          confirmText={t("settings.confirmKickButton")}
          cancelText={t("settings.cancelButton")}
          variant="danger"
          onConfirm={() => {
            handleRemoveParticipant(participantToRemove.id);
            setParticipantToRemove(null);
          }}
          onCancel={() => setParticipantToRemove(null)}
        />
      )}

      {/* Footer with keyboard shortcuts */}
      <footer className="fixed bottom-0 left-0 right-0 py-2 sm:py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          {/* Space - Reveal */}
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
              ⎵
            </kbd>
            <span className="hidden sm:inline">{t("shortcuts.reveal")}</span>
            <span className="sm:hidden">Reveal</span>
          </div>

          {/* R - New Round */}
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
              R
            </kbd>
            <span className="hidden sm:inline">{t("shortcuts.newRound")}</span>
            <span className="sm:hidden">Round</span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

          {/* Show all shortcuts button */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
              ?
            </kbd>
            <span className="hidden sm:inline">{t("shortcuts.showHelp")}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
