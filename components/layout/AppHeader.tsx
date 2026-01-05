'use client';

import { Session } from 'next-auth';
import { HeaderMenu } from './HeaderMenu';
import { UserMenu } from './UserMenu';

interface AppHeaderProps {
  currentDate: Date;
  session: Session | null;
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onOpenArbre: () => void;
  onOpenProgression: () => void;
  onClearChat: () => void;
  onOpenNotifications: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

/**
 * Composant header de l'application avec menu utilisateur et navigation
 */
export function AppHeader({
  currentDate,
  session,
  onOpenSettings,
  onOpenRules,
  onOpenArbre,
  onOpenProgression,
  onClearChat,
  onOpenNotifications,
  isMenuOpen,
  setIsMenuOpen,
  menuRef,
}: AppHeaderProps) {
  return (
    <header className="bg-notion-bg border-b border-notion-border shadow-sm">
      <div className="max-w-[1800px] mx-auto px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Logo et Branding */}
          <div className="flex items-center gap-6">
            <HeaderMenu
              isOpen={isMenuOpen}
              setIsOpen={setIsMenuOpen}
              menuRef={menuRef}
              onOpenSettings={onOpenSettings}
              onOpenRules={onOpenRules}
              onOpenArbre={onOpenArbre}
              onOpenProgression={onOpenProgression}
              onClearChat={onClearChat}
            />

            <h1 className="text-2xl font-bold text-notion-text tracking-tight">Tempo</h1>

            {/* Date actuelle - Simple */}
            <div className="hidden md:block text-sm text-notion-textLight border-l border-notion-border pl-6">
              {currentDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>

          {/* Menu utilisateur et actions */}
          <UserMenu session={session} onOpenNotifications={onOpenNotifications} />
        </div>
      </div>
    </header>
  );
}
