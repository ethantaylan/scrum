import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Room, Participant } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

interface RoomSettingsModalProps {
  room: Room;
  currentParticipantId: string;
  onClose: () => void;
  onRenameRoom: (newName: string) => Promise<void>;
  onKickParticipant: (participantId: string) => Promise<void>;
  onToggleAutoReveal: (enabled: boolean) => Promise<void>;
}

export function RoomSettingsModal({
  room,
  currentParticipantId,
  onClose,
  onRenameRoom,
  onKickParticipant,
  onToggleAutoReveal,
}: RoomSettingsModalProps) {
  const { t } = useTranslation();
  const [roomName, setRoomName] = useState(room.name);
  const [autoReveal, setAutoReveal] = useState(room.autoReveal);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isCreator = room.creatorId === currentParticipantId;

  if (!isCreator) {
    return null;
  }

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (roomName.trim() !== room.name) {
        await onRenameRoom(roomName.trim());
      }

      if (autoReveal !== room.autoReveal) {
        await onToggleAutoReveal(autoReveal);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKick = async (participantId: string) => {
    if (confirm('Are you sure you want to kick this participant?')) {
      try {
        await onKickParticipant(participantId);
      } catch (err) {
        console.error('Failed to kick participant:', err);
        setError('Failed to kick participant');
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('settings.roomSettings')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Room Name */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('settings.roomName')}
              </h3>
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder={t('home.roomName')}
                maxLength={30}
              />
            </div>

            {/* Room Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('settings.roomInfo')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">{t('settings.deckType')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {t(`decks.${room.deckType}`)}
                  </span>
                </div>
                {room.password && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">{t('settings.password')}</span>
                    <span className="font-medium text-gray-900 dark:text-white font-mono">
                      {room.password}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-reveal Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('settings.votingSettings')}
              </h3>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={autoReveal}
                  onChange={(e) => setAutoReveal(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t('settings.autoReveal')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.autoRevealDesc')}
                  </div>
                </div>
              </label>
            </div>

            {/* Participants Management */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t('settings.manageParticipants')} ({room.participants.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {room.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{participant.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {participant.nickname}
                          </span>
                          {participant.id === room.creatorId && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full">
                              {t('settings.creator')}
                            </span>
                          )}
                          {participant.isSpectator && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">
                              {t('settings.spectator')}
                            </span>
                          )}
                        </div>
                        <div className={`text-xs ${
                          participant.isOnline
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {participant.isOnline ? 'Online' : 'Offline'}
                        </div>
                      </div>
                    </div>
                    {participant.id !== room.creatorId && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleKick(participant.id)}
                      >
                        {t('settings.kick')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={onClose}
              disabled={isLoading}
            >
              {t('home.cancel')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? t('settings.saving') : t('settings.saveChanges')}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
