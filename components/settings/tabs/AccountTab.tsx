'use client';

import { signOut } from 'next-auth/react';
import { User, Shield, LogOut, Mail } from '@/components/icons';
import { Section } from '../components/Section';

interface AccountTabProps {
  userInfo: { name: string; email: string; avatar: string };
}

/**
 * Tab des paramètres de compte
 */
export function AccountTab({ userInfo }: AccountTabProps) {
  return (
    <div className="space-y-6">
      <Section title="Informations personnelles" icon={User}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-notion-orange to-notion-yellow rounded-full flex items-center justify-center font-bold text-white text-2xl">
            {userInfo.avatar}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-notion-text">
              {userInfo.name}
            </p>
            <p className="text-xs text-notion-textLight mt-1">
              Connecté via Google
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-notion-text mb-2">
              Nom complet
            </label>
            <input
              type="text"
              value={userInfo.name}
              disabled
              className="w-full px-3 py-2 border border-notion-border rounded-lg bg-notion-sidebar text-notion-textLight cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-notion-text mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={userInfo.email}
              disabled
              className="w-full px-3 py-2 border border-notion-border rounded-lg bg-notion-sidebar text-notion-textLight cursor-not-allowed"
            />
          </div>
        </div>
      </Section>

      <Section title="Sécurité" icon={Shield}>
        <button className="w-full px-4 py-2.5 text-left text-sm font-medium text-notion-text hover:bg-notion-hover rounded-lg transition-colors border border-notion-border">
          Changer le mot de passe
        </button>
        <button className="w-full px-4 py-2.5 text-left text-sm font-medium text-notion-text hover:bg-notion-hover rounded-lg transition-colors border border-notion-border mt-3">
          Activer l'authentification à deux facteurs
        </button>
      </Section>

      <Section title="Session" icon={LogOut}>
        <button
          onClick={() => signOut()}
          className="w-full px-4 py-2.5 text-left text-sm font-medium text-notion-textLight hover:bg-notion-hover rounded-lg transition-colors border border-notion-border flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </Section>
    </div>
  );
}

