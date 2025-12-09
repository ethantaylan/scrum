import { useState } from "react";
import { EMOJI_AVATARS } from "../../constants/decks";

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
  label?: string;
}

export function AvatarSelector({
  selectedAvatar,
  onSelect,
  label,
}: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-white dark:bg-gray-200 flex items-center justify-center text-3xl shadow-sm">
              {selectedAvatar}
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {label || "Select Avatar"}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              <div className="grid grid-cols-8 gap-3 p-4">
                {EMOJI_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => {
                      onSelect(avatar);
                      setIsOpen(false);
                    }}
                    className={`w-12 h-12 text-2xl rounded-full transition-all flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950 ${
                      selectedAvatar === avatar
                        ? "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500"
                        : "bg-gray-50 dark:bg-gray-700"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
