'use client';

import { useEffect } from 'react';
import { startLobbyMusic } from '@/client/lib/sound';

// Mounted once at the app root: keeps the lobby theme playing across every page.
// The game page pauses it during a live run via setGameActive(). Autoplay is
// blocked until the user interacts, so we also retry on the first gesture.
export default function LobbyMusic() {
  useEffect(() => {
    startLobbyMusic();
    const kick = () => startLobbyMusic();
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
    return () => {
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
  }, []);
  return null;
}
