import { useTranslation } from 'react-i18next';
import type { Participant } from '../types/index';

interface ParticipantCardProps {
  participant: Participant;
  isRevealed: boolean;
  isCurrentUser?: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
}

export function ParticipantCard({ participant, isRevealed, isCurrentUser, canRemove, onRemove, onEdit }: ParticipantCardProps) {
  const { t } = useTranslation();

  const getVoteDisplay = () => {
    if (!participant.hasVoted) {
      return (
        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 animate-pulse" />
        </div>
      );
    }

    if (!isRevealed) {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }

    const voteValue = participant.vote || '—';
    return (
      <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shadow-sm">
        <span className="text-sm font-bold text-white">{voteValue}</span>
      </div>
    );
  };

  return (
    <div
      className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 ${
        isCurrentUser
          ? 'bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-200 dark:ring-blue-800'
          : 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800'
      } ${participant.isSpectator ? 'opacity-60' : ''} ${participant.isOnline ? '' : 'opacity-50'}`}
    >
      {/* Avatar with online indicator */}
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-900 flex items-center justify-center text-xl">
          {participant.avatar || '👤'}
        </div>
        {participant.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
        )}
      </div>

      {/* Name with badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {participant.nickname}
          </span>
          {isCurrentUser && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              YOU
            </span>
          )}
          {participant.isSpectator && (
            <svg className="w-3.5 h-3.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isCurrentUser && onEdit && (
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
            title="Edit profile"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        {canRemove && !isCurrentUser && onRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
            title={t('settings.kick')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Vote indicator */}
      {!participant.isSpectator && (
        <div className="shrink-0">
          {getVoteDisplay()}
        </div>
      )}
    </div>
  );
}
