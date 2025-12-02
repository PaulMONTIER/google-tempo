'use client';

import { signIn } from 'next-auth/react';

/**
 * Composant d'écran de connexion affiché lorsque l'utilisateur n'est pas authentifié
 */
export function AuthGate() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-notion-sidebar px-6 text-center">
      <div className="max-w-xl bg-notion-bg border border-notion-border rounded-2xl p-10 shadow-lg space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-notion-textLight mb-3">Tempo</p>
          <h1 className="text-3xl font-semibold text-notion-text mb-2">Connectez votre compte Google</h1>
          <p className="text-notion-textLight">
            Pour que Tempo puisse analyser votre agenda et créer des événements, connectez-vous avec votre compte Google.
          </p>
        </div>
        <button
          onClick={() => signIn('google')}
          className="w-full py-3 rounded-xl bg-notion-blue text-white font-medium hover:opacity-90 transition-all"
        >
          Se connecter avec Google
        </button>
      </div>
    </div>
  );
}

