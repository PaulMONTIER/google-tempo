'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { User, Shield, LogOut, Mail, Settings } from '@/components/ui/icons';
import { Gift, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { Section } from '../components/Section';
import { ToggleSetting } from '../components/ToggleSetting';

interface AccountTabProps {
  userInfo: { name: string; email: string; avatar: string };
}

/**
 * Tab des paramètres de compte
 */
export function AccountTab({ userInfo }: AccountTabProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [acceptPromotional, setAcceptPromotional] = useState(false);
  const [acceptPersonalized, setAcceptPersonalized] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true); // Par défaut true pour éviter flash

  // Charge les préférences et l'état de l'onboarding au montage
  useEffect(() => {
    async function loadData() {
      try {
        // Charger état onboarding
        const onboardingRes = await fetch('/api/onboarding/status');
        if (onboardingRes.ok) {
          const onboardingData = await onboardingRes.json();
          setOnboardingCompleted(onboardingData.completed ?? false);
        }

        // Charger préférences promotionnelles
        const promoRes = await fetch('/api/preferences/promotional');
        if (promoRes.ok) {
          const promoData = await promoRes.json();
          setAcceptPromotional(promoData.acceptPromotionalContent ?? false);
          setAcceptPersonalized(promoData.acceptPersonalizedOffers ?? false);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    }
    loadData();
  }, []);

  const handleGoToOnboarding = () => {
    setIsNavigating(true);
    router.push('/onboarding');
  };

  const handleReconfigureProfile = async () => {
    setIsNavigating(true);
    try {
      // Reset l'onboarding dans la DB
      const response = await fetch('/api/onboarding/reset', { method: 'POST' });
      if (response.ok) {
        router.push('/onboarding');
      }
    } catch (error) {
      console.error('Erreur lors du reset:', error);
      setIsNavigating(false);
    }
  };

  const handlePromotionalChange = async (value: boolean) => {
    setAcceptPromotional(value);
    await fetch('/api/preferences/promotional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acceptPromotionalContent: value }),
    });
  };

  const handlePersonalizedChange = async (value: boolean) => {
    setAcceptPersonalized(value);
    await fetch('/api/preferences/promotional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acceptPersonalizedOffers: value }),
    });
  };

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

      {/* Section Profil - Toujours visible, contenu différent selon état */}
      <Section title="Ton profil" icon={Settings}>
        {!onboardingCompleted ? (
          // Onboarding pas fait -> Call to action fort
          <div className="p-4 bg-gradient-to-r from-notion-blue/10 to-purple-500/10 rounded-xl border border-notion-blue/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-notion-blue/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-notion-blue" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-notion-text">Complète ton profil !</p>
                <p className="text-xs text-notion-textLight mt-1">
                  Configure tes matières, objectifs et préférences pour une expérience personnalisée
                </p>
              </div>
              <button
                onClick={handleGoToOnboarding}
                disabled={isNavigating}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white 
                         bg-notion-blue hover:bg-notion-blue/90 rounded-lg transition-colors
                         shadow-md shadow-notion-blue/25
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNavigating ? (
                  <span>Chargement...</span>
                ) : (
                  <>
                    <span>Configurer</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Onboarding fait -> Option de reconfigurer
          <div className="p-4 bg-notion-sidebar rounded-xl border border-notion-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <span className="text-green-500 text-xl">✓</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-notion-text">Profil configuré</p>
                <p className="text-xs text-notion-textLight mt-1">
                  Tu peux reconfigurer tes matières et préférences à tout moment
                </p>
              </div>
              <button
                onClick={handleReconfigureProfile}
                disabled={isNavigating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-notion-textLight
                         bg-notion-hover hover:bg-notion-border rounded-lg transition-colors
                         border border-notion-border
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNavigating ? (
                  <span>Chargement...</span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Reconfigurer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Section>

      <Section title="Contenu personnalisé" icon={Gift}>
        <div className="space-y-4">
          <ToggleSetting
            label="Recevoir du contenu adapté"
            description="Conseils et ressources personnalisés selon ton profil et tes objectifs"
            enabled={acceptPersonalized}
            onChange={handlePersonalizedChange}
          />
          <ToggleSetting
            label="Recevoir des offres promotionnelles"
            description="Réductions et offres partenaires (certifications, formations, équipements)"
            enabled={acceptPromotional}
            onChange={handlePromotionalChange}
          />
          <p className="text-xs text-notion-textLight mt-2 p-3 bg-notion-sidebar rounded-lg">
            💡 Ces données ne sont jamais partagées avec des tiers.
            Tu peux modifier ces choix à tout moment.
          </p>
        </div>
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

      {/* Section Dev - Visible uniquement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <DevSection onReset={() => window.location.reload()} />
      )}
    </div>
  );
}

/**
 * Section de développement pour reset
 */
function DevSection({ onReset }: { onReset: () => void }) {
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const handleResetOnboarding = async () => {
    if (!confirm('Cela va réinitialiser ton onboarding et préférences (tes points et analyse rétroactive seront conservés). Continuer ?')) {
      return;
    }

    setIsResetting(true);
    setResetResult(null);

    try {
      const response = await fetch('/api/dev/reset-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeRetroactiveAnalysis: false }),
      });
      const data = await response.json();

      if (response.ok) {
        setResetResult(data.message);
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        setResetResult(`❌ Erreur: ${data.error || 'Inconnue'}`);
      }
    } catch {
      setResetResult('❌ Erreur réseau');
    } finally {
      setIsResetting(false);
    }
  };

  const handleFullReset = async () => {
    if (!confirm('⚠️ Reset COMPLET :\n\n• Efface toutes tes données (points, analyse, onboarding)\n• Te déconnecte\n\nTu devras te reconnecter avec Google pour simuler une vraie première connexion.\n\nContinuer ?')) {
      return;
    }

    setIsResetting(true);
    setResetResult(null);

    try {
      const response = await fetch('/api/dev/reset-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeRetroactiveAnalysis: true }),
      });

      if (response.ok) {
        setResetResult('🔄 Données effacées, déconnexion...');
        // Déconnexion après 1 seconde
        setTimeout(() => {
          signOut({ callbackUrl: '/' });
        }, 1000);
      } else {
        const data = await response.json();
        setResetResult(`❌ Erreur: ${data.error || 'Inconnue'}`);
        setIsResetting(false);
      }
    } catch {
      setResetResult('❌ Erreur réseau');
      setIsResetting(false);
    }
  };

  const handleRevokeOAuth = async () => {
    if (!confirm('Cela va révoquer ton autorisation Google (Drive, Gmail, Calendar).\n\nTu devras te reconnecter et ré-autoriser les permissions.\n\nContinuer ?')) {
      return;
    }

    setIsResetting(true);
    setResetResult(null);

    try {
      const response = await fetch('/api/auth/revoke', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        setResetResult('✅ OAuth révoqué ! Déconnexion...');
        setTimeout(() => {
          signOut({ callbackUrl: '/' });
        }, 1500);
      } else {
        setResetResult(`❌ Erreur: ${data.error || 'Inconnue'}`);
        setIsResetting(false);
      }
    } catch {
      setResetResult('❌ Erreur réseau');
      setIsResetting(false);
    }
  };

  return (
    <Section title="🛠️ Développement" icon={RefreshCw}>
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700 space-y-3">
        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
          Mode développement
        </p>

        {/* Reset onboarding uniquement */}
        <button
          onClick={handleResetOnboarding}
          disabled={isResetting}
          className="w-full px-4 py-2.5 text-sm font-medium text-yellow-800
                   bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 border border-yellow-300"
        >
          {isResetting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Refaire l&apos;onboarding</span>
        </button>

        {/* Reset complet + déconnexion */}
        <button
          onClick={handleFullReset}
          disabled={isResetting}
          className="w-full px-4 py-2.5 text-sm font-medium text-white
                   bg-red-600 hover:bg-red-700 rounded-lg transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
        >
          {isResetting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span>🔄 Reset COMPLET + Déconnexion</span>
        </button>

        {/* Révoquer OAuth - Fix Drive 403 */}
        <button
          onClick={handleRevokeOAuth}
          disabled={isResetting}
          className="w-full px-4 py-2.5 text-sm font-medium text-blue-800
                   bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 border border-blue-300"
        >
          {isResetting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          <span>🔑 Révoquer OAuth (Fix Drive/Gmail)</span>
        </button>

        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          Le reset complet efface tout et te déconnecte pour simuler une vraie première connexion.
        </p>

        {resetResult && (
          <p className={`text-xs text-center p-2 rounded ${resetResult.startsWith('✅') || resetResult.startsWith('🔄') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {resetResult}
          </p>
        )}
      </div>
    </Section>
  );
}

