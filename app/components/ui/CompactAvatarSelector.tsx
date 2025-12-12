import { useState } from "react";
import { AvatarSelectorModal } from "./AvatarSelectorModal";

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
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative group"
      >
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-900/60 flex items-center justify-center text-xl transition-all shadow-sm hover:ring-2 hover:ring-blue-500">
          {selectedAvatar}
        </div>
      </button>

      {isOpen && (
        <AvatarSelectorModal
          selectedAvatar={selectedAvatar}
          onSelect={onSelect}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
