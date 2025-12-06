import { useTranslation } from 'react-i18next';
import type { Participant, VoteValue } from '../types/index';
import { Card } from './ui/Card';

interface VotingStatsProps {
  participants: Participant[];
  isRevealed: boolean;
}

export function VotingStats({ participants, isRevealed }: VotingStatsProps) {
  const { t } = useTranslation();

  if (!isRevealed) return null;

  const votes = participants
    .filter(p => p.hasVoted && p.vote && p.vote !== '?' && p.vote !== '☕')
    .map(p => p.vote as VoteValue);

  if (votes.length === 0) return null;

  const numericVotes = votes
    .map(v => parseFloat(v as string))
    .filter(v => !isNaN(v));

  const average = numericVotes.length > 0
    ? (numericVotes.reduce((sum, v) => sum + v, 0) / numericVotes.length).toFixed(1)
    : null;

  const voteCounts = votes.reduce((acc, vote) => {
    acc[vote] = (acc[vote] || 0) + 1;
    return acc;
  }, {} as Record<VoteValue, number>);

  const maxCount = Math.max(...Object.values(voteCounts));
  const mostCommon = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxCount)
    .map(([vote]) => vote);

  const hasConsensus = mostCommon.length === 1 && maxCount === votes.length;

  return (
    <Card variant="elevated" className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Voting Results
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {average && (
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {t('voting.average')}
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {average}
            </div>
          </div>
        )}

        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {t('voting.consensus')}
          </div>
          <div className={`text-3xl font-bold ${
            hasConsensus ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {hasConsensus ? mostCommon[0] : '—'}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(voteCounts)
            .sort(([a], [b]) => {
              const numA = parseFloat(a);
              const numB = parseFloat(b);
              if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
              return a.localeCompare(b);
            })
            .map(([vote, count]) => (
              <div
                key={vote}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
              >
                <span className="font-semibold text-gray-900 dark:text-white">{vote}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">×{count}</span>
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
}
