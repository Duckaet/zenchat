import { useState } from 'react';

export function useSettings() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);
  const toggleSettings = () => setIsSettingsOpen(prev => !prev);

  return {
    isSettingsOpen,
    openSettings,
    closeSettings,
    toggleSettings,
  };
}
