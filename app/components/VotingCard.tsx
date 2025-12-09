import type { VoteValue } from '../types/index';

interface VotingCardProps {
  value: VoteValue;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VotingCard({ value, isSelected, onClick, disabled }: VotingCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-14 h-20 sm:w-16 sm:h-24 rounded-lg font-bold text-lg sm:text-xl transition-all duration-200
        transform active:scale-95 sm:hover:scale-105 sm:hover:-translate-y-1
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0
        touch-manipulation
        ${
          isSelected
            ? 'bg-blue-600 text-white shadow-xl scale-105 -translate-y-1'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 sm:hover:border-blue-500 dark:sm:hover:border-blue-400 shadow-md'
        }
      `}
    >
      {value}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}
