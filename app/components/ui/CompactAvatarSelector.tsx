import { useState } from "react";
import { EMOJI_AVATARS } from "../../constants/decks";

interface CompactAvatarSelectorProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
}

export function CompactAvatarSelector({
  selectedAvatar,
  onSelect,
}: CompactAvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-900/60 flex items-center justify-center text-xl transition-all shadow-sm hover:ring-2 hover:ring-blue-500">
          {selectedAvatar}
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
            <div className="p-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                Choose your avatar
              </div>
              <div className="grid grid-cols-12 gap-14 p-4">
                {EMOJI_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => {
                      onSelect(avatar);
                      setIsOpen(false);
                    }}
                    className={`rounded-full text-xl transition-all flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950 ${
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
          </div>
        </>
      )}
    </div>
  );
}
