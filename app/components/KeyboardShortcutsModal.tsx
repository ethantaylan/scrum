import { useTranslation } from "react-i18next";
import { useEffect } from "react";

interface KeyboardShortcut {
  key: string;
  label: string;
  description: string;
}

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "Space",
      label: "⎵",
      description: t("shortcuts.reveal"),
    },
    {
      key: "R",
      label: "R",
      description: t("shortcuts.newRound"),
    },
    {
      key: "C",
      label: "C",
      description: t("shortcuts.copyLink"),
    },
    {
      key: "?",
      label: "?",
      description: t("shortcuts.showHelp"),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t("shortcuts.title")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("shortcuts.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label={t("shortcuts.close")}
          >
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
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
        </div>

        {/* Shortcuts List */}
        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {shortcut.description}
              </span>
              <kbd className="inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
                {shortcut.label}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Esc</kbd> or <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">?</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
