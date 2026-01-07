'use client';

import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { Bell } from '@/components/ui/icons';

interface UserMenuProps {
  session: Session | null;
  onOpenNotifications: () => void;
}

/**
 * Menu utilisateur avec avatar, infos et déconnexion
 */
export function UserMenu({ session, onOpenNotifications }: UserMenuProps) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/gamification/task-validations?count=true');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPendingCount(data.data.count);
          }
        }
      } catch (err) {
        console.error('Erreur fetchCount:', err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30 * 60 * 1000); // Refresh toutes les 30 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <button
        className="p-2.5 hover:bg-notion-sidebar rounded-lg transition-colors relative"
        onClick={onOpenNotifications}
      >
        <Bell className="w-5 h-5 text-notion-textLight" />
        {pendingCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-notion-red rounded-full flex items-center justify-center text-xs font-semibold text-white px-1">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>
      <div className="h-8 w-px bg-notion-border"></div>
      <div className="flex items-center gap-3 px-3 py-2 bg-notion-sidebar rounded-lg transition-colors">
        <div className="w-9 h-9 bg-gradient-to-br from-notion-orange to-notion-yellow rounded-full flex items-center justify-center font-semibold text-white text-sm uppercase">
          {session?.user?.name?.slice(0, 2) ?? 'TM'}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-sm font-medium text-notion-text">{session?.user?.name ?? 'Utilisateur Tempo'}</p>
          <p className="text-xs text-notion-textLight">{session?.user?.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="text-xs text-notion-textLight underline hover:text-notion-text"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}

