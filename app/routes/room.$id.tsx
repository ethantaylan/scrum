import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/room.$id';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { VotingCard } from '../components/VotingCard';
import { ParticipantCard } from '../components/ParticipantCard';
import { VotingStats } from '../components/VotingStats';
import { useSupabase } from '../hooks/useSupabase';
import { useRoomStore } from '../stores/room.store';
import type { VoteValue } from '../types';

const VOTE_OPTIONS: VoteValue[] = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'];

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Scrum Poker - Room ${params.id}` },
    { name: 'description', content: 'Real-time scrum poker voting room' },
  ];
}

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const supabase = useSupabase();
  const { currentRoom, currentParticipant, setRoom, setParticipant, leaveRoom: clearRoom } = useRoomStore();
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
  const [copied, setCopied] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    // If user is not in a room, show join modal instead of redirecting
    if (!currentRoom || !currentParticipant) {
      setShowJoinModal(true);
    }
  }, [currentRoom, currentParticipant]);

  // Update participant status when component mounts/unmounts
  useEffect(() => {
    if (!currentParticipant) return;

    supabase.updateParticipantStatus(currentParticipant.id, true);

    return () => {
      supabase.updateParticipantStatus(currentParticipant.id, false);
    };
  }, [currentParticipant, supabase]);

  const handleVote = async (vote: VoteValue) => {
    if (!currentRoom || !currentParticipant || currentRoom.isRevealed) return;

    setSelectedVote(vote);
    try {
      await supabase.castVote(currentParticipant.id, vote);
    } catch (error) {
      console.error('Failed to cast vote:', error);
    }
  };

  const handleReveal = async () => {
    if (!currentRoom) return;
    try {
      await supabase.revealVotes(currentRoom.id);
    } catch (error) {
      console.error('Failed to reveal votes:', error);
    }
  };

  const handleReset = async () => {
    if (!currentRoom) return;
    setSelectedVote(null);
    try {
      await supabase.resetVotes(currentRoom.id);
    } catch (error) {
      console.error('Failed to reset votes:', error);
    }
  };

  const handleLeave = async () => {
    if (!currentRoom || !currentParticipant) return;
    try {
      await supabase.leaveRoom(currentRoom.id, currentParticipant.id);
      clearRoom();
      navigate('/');
    } catch (error) {
      console.error('Failed to leave room:', error);
      clearRoom();
      navigate('/');
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/room/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleJoinFromLink = async () => {
    if (!nickname.trim()) {
      setJoinError(t('errors.nicknameRequired'));
      return;
    }

    if (!id) {
      navigate('/');
      return;
    }

    setIsJoining(true);
    setJoinError('');

    try {
      const { room, participant } = await supabase.joinRoom(id, nickname.trim());
      setRoom(room);
      setParticipant(participant);
      setShowJoinModal(false);
    } catch (error) {
      console.error('Failed to join room:', error);
      setJoinError(t('errors.roomNotFound'));
    } finally {
      setIsJoining(false);
    }
  };

  // Show join modal when user lands on room link without being in the room
  if (showJoinModal && (!currentRoom || !currentParticipant)) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('home.joinRoom')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('home.enterNickname')}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label={t('home.enterNickname')}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleJoinFromLink();
                }
              }}
              error={joinError}
              placeholder="John Doe"
              maxLength={20}
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onClick={() => navigate('/')}
              >
                {t('home.cancel')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleJoinFromLink}
                disabled={!nickname.trim() || isJoining}
              >
                {isJoining ? t('home.joining') : t('home.join')}
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

  const allVoted = currentRoom.participants.every(p => p.hasVoted);
  const votedCount = currentRoom.participants.filter(p => p.hasVoted).length;

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
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{t('room.roomId')}:</span>
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
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLeave}>
                {t('room.leave')}
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentRoom.isRevealed ? t('room.everyoneVoted') : t('room.selectCard')}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {votedCount} / {currentRoom.participants.length} {t('room.hasVoted')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!currentRoom.isRevealed && allVoted && (
                    <Button variant="primary" onClick={handleReveal}>
                      {t('room.reveal')}
                    </Button>
                  )}
                  {currentRoom.isRevealed && (
                    <Button variant="secondary" onClick={handleReset}>
                      {t('room.newRound')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Voting Progress */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(votedCount / currentRoom.participants.length) * 100}%` }}
                />
              </div>

              {/* Voting Cards */}
              {!currentRoom.isRevealed && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {VOTE_OPTIONS.map((value) => (
                    <VotingCard
                      key={value}
                      value={value}
                      isSelected={selectedVote === value}
                      onClick={() => handleVote(value)}
                      disabled={currentRoom.isRevealed}
                    />
                  ))}
                </div>
              )}

              {/* Current Vote Display */}
              {selectedVote && !currentRoom.isRevealed && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t('room.youVoted')}
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedVote}
                  </p>
                </div>
              )}
            </Card>

            {/* Voting Statistics */}
            <VotingStats
              participants={currentRoom.participants}
              isRevealed={currentRoom.isRevealed}
            />
          </div>

          {/* Participants Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {t('room.participants')} ({currentRoom.participants.length})
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
