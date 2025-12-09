import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { CompactAvatarSelector } from './ui/CompactAvatarSelector';

interface ProfileEditModalProps {
  currentNickname: string;
  currentAvatar: string;
  onSave: (nickname: string, avatar: string) => Promise<void>;
  onCancel: () => void;
}

export function ProfileEditModal({
  currentNickname,
  currentAvatar,
  onSave,
  onCancel,
}: ProfileEditModalProps) {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState(currentNickname);
  const [avatar, setAvatar] = useState(currentAvatar);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError(t('errors.nicknameRequired'));
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave(nickname.trim(), avatar);
    } catch (err) {
      setError('Failed to update profile');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50">
      <Card variant="elevated" className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Edit Profile
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Update your nickname and avatar
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('home.selectAvatar')}
            </label>
            <CompactAvatarSelector
              selectedAvatar={avatar}
              onSelect={setAvatar}
            />
          </div>

          <Input
            label={t('home.enterNickname')}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isSaving) {
                handleSave();
              }
            }}
            error={error}
            placeholder="John Doe"
            maxLength={20}
            autoFocus
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={onCancel}
              disabled={isSaving}
            >
              {t('home.cancel')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSave}
              disabled={!nickname.trim() || isSaving}
            >
              {isSaving ? t('settings.saving') : t('settings.saveChanges')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
