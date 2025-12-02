'use client';

import { useRouter } from 'next/navigation';
import { Settings, Menu, Trash, HelpCircle, Zap, GitBranch, TrendingUp } from '@/components/icons';
import { Z_INDEX } from '@/lib/constants/ui-constants';

interface HeaderMenuProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onOpenArbre: () => void;
  onClearChat: () => void;
}

/**
 * Menu hamburger avec dropdown pour les actions principales
 */
export function HeaderMenu({
  isOpen,
  setIsOpen,
  menuRef,
  onOpenSettings,
  onOpenRules,
  onOpenArbre,
  onClearChat,
}: HeaderMenuProps) {
  const router = useRouter();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-notion-sidebar rounded-lg transition-colors"
      >
        <Menu className="w-5 h-5 text-notion-textLight" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-notion-bg border border-notion-border rounded-lg shadow-lg" style={{ zIndex: Z_INDEX.dropdown }}>
          <div className="py-1">
            <button
              onClick={() => {
                onOpenSettings();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-notion-text hover:bg-notion-hover transition-colors"
            >
              <Settings className="w-4 h-4 text-notion-textLight" />
              Réglages
            </button>
            <button
              onClick={() => {
                onOpenRules();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-notion-text hover:bg-notion-hover transition-colors"
            >
              <Zap className="w-4 h-4 text-notion-textLight" />
              Règles
            </button>
            <button
              onClick={() => {
                onOpenArbre();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-notion-text hover:bg-notion-hover transition-colors"
            >
              <GitBranch className="w-4 h-4 text-notion-textLight" />
              Arbre
            </button>
            <button
              onClick={() => {
                router.push('/progression');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-notion-text hover:bg-notion-hover transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-notion-textLight" />
              Ma Progression
            </button>
            <button
              onClick={() => {
                onClearChat();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-notion-text hover:bg-notion-hover transition-colors"
            >
              <Trash className="w-4 h-4 text-notion-textLight" />
              Effacer la conversation
            </button>
            <div className="border-t border-notion-border my-1"></div>
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-notion-text hover:bg-notion-hover transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-notion-textLight" />
              Aide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

