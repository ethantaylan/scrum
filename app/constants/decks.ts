import type { VoteValue, DeckType } from "../types";

export interface DeckConfig {
  type: DeckType;
  name: string;
  nameFr: string;
  numeric: VoteValue[];
  special: VoteValue[];
}

export const FIBONACCI_DECK: DeckConfig = {
  type: "fibonacci",
  name: "Fibonacci",
  nameFr: "Fibonacci",
  numeric: ["0", "1", "2", "3", "5", "8", "13", "21"],
  special: ["?", "☕"],
};

export const TSHIRT_DECK: DeckConfig = {
  type: "tshirt",
  name: "T-Shirt Sizes",
  nameFr: "Tailles T-Shirt",
  numeric: ["XS", "S", "M", "L", "XL", "XXL"],
  special: ["?", "☕"],
};

export const HOURS_DECK: DeckConfig = {
  type: "hours",
  name: "Hours",
  nameFr: "Heures",
  numeric: ["0.5h", "1h", "2h", "4h", "8h", "16h"],
  special: ["?", "☕"],
};

export const DECKS: Record<DeckType, DeckConfig> = {
  fibonacci: FIBONACCI_DECK,
  tshirt: TSHIRT_DECK,
  hours: HOURS_DECK,
};

export const DECK_OPTIONS: DeckConfig[] = [
  FIBONACCI_DECK,
  TSHIRT_DECK,
  HOURS_DECK,
];

export const EMOJI_AVATARS = [
  "😀",
  "🙃",
  "🥳",
  "🤓",
  "😎",
  "🤠",
  "🥸",
  "🤖",
  "👻",
  "🐱",
  "🐶",
  "🐻",
  "🐼",
  "🦊",
  "🦁",
  "🐸",
  "🐵",
  "🦄",
  "🐢",
  "🐙",
  "🐳",
  "🦈",
  "🦒",
  "🍀",
  "🍕",
  "🥐",
  "🍣",
  "🍩",
  "☕",
  "🍺",
];
