import type { VoteValue } from "../types";

export const parseVoteToNumber = (vote: VoteValue | null) => {
  if (!vote) return null;
  const cleaned =
    typeof vote === "string" && vote.endsWith("h") ? vote.slice(0, -1) : vote;
  const numeric = Number.parseFloat(cleaned);
  return Number.isNaN(numeric) ? null : numeric;
};
