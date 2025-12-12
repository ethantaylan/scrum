import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { EMOJI_AVATARS } from "../../constants/decks";
import { Card } from "./Card";

interface AvatarSelectorModalProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

export function AvatarSelectorModal({
  selectedAvatar,
  onSelect,
  onClose,
}: AvatarSelectorModalProps) {
  const { t } = useTranslation();
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-md relative">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Header */}
          <div className="p-6 pb-4 text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("home.avatarModalTitle")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("home.avatarModalSubtitle")}
            </p>
          </div>

          {/* Avatar Grid */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => {
                    onSelect(avatar);
                    onClose();
                  }}
                  className={`h-12 w-12 rounded-lg text-2xl transition-all flex items-center justify-center hover:scale-110 ${
                    selectedAvatar === avatar
                      ? "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500 scale-105"
                      : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
