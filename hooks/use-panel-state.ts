import { useState, useRef, useEffect } from 'react';

/**
 * Hook pour gérer l'état de tous les panneaux modaux et le menu
 * @returns Objet contenant tous les états et setters pour les panneaux
 */
export function usePanelState() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isArbreOpen, setIsArbreOpen] = useState(false);
  const [isProgressionOpen, setIsProgressionOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return {
    // Settings panel
    isSettingsOpen,
    setIsSettingsOpen,

    // Notification panel
    isNotificationPanelOpen,
    setIsNotificationPanelOpen,

    // Rules panel
    isRulesOpen,
    setIsRulesOpen,

    // Arbre panel
    isArbreOpen,
    setIsArbreOpen,

    // Progression panel
    isProgressionOpen,
    setIsProgressionOpen,

    // Menu
    isMenuOpen,
    setIsMenuOpen,
    menuRef,
  };
}
