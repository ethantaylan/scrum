import { useTranslation } from 'react-i18next';
import type { Participant, VoteValue } from '../types/index';
import { Card } from './ui/Card';

interface ParticipantCardProps {
  participant: Participant;
  isRevealed: boolean;
  isCurrentUser?: boolean;
}

export function ParticipantCard({ participant, isRevealed, isCurrentUser }: ParticipantCardProps) {
  const { t } = useTranslation();

  const getVoteDisplay = () => {
    if (!participant.hasVoted) {
      return (
        <div className="text-gray-400 dark:text-gray-500 text-sm">
          {t('room.waiting')}
        </div>
      );
    }

    if (isRevealed && participant.vote) {
      return (
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {participant.vote}
        </div>
      );
    }

    return (
      <div className="w-8 h-12 bg-blue-600 dark:bg-blue-500 rounded flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  return (
    <Card
      variant="bordered"
      className={`p-4 transition-all duration-200 ${
        isCurrentUser ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
            participant.isOnline ? 'bg-linear-to-br from-blue-500 to-purple-600' : 'bg-gray-400'
          }`}>
            {participant.nickname.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {participant.nickname}
              </p>
              {isCurrentUser && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1 text-xs ${
              participant.isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              {participant.isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          {getVoteDisplay()}
        </div>
      </div>
    </Card>
  );
}
