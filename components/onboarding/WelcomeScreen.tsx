'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sparkles, ArrowRight, Rocket, Calendar, CheckCircle2, Loader2, TrendingUp } from 'lucide-react';
import { useRetroactiveAnalysis } from '@/hooks/use-retroactive-analysis';

interface WelcomeScreenProps {
  onContinue?: () => void;
  onSkip?: () => void;
}

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
}

/**
 * WelcomeScreen - Écran de bienvenue post-connexion avec analyse rétroactive
 * Lance automatiquement l'analyse du calendrier dès la première connexion
 */
export function WelcomeScreen({ onContinue, onSkip }: WelcomeScreenProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  // Hook d'analyse rétroactive
  const {
    isLoading: analysisLoading,
    hasCompleted: analysisCompleted,
    phase,
    progress,
    message,
    results,
    error,
    startAnalysis,
  } = useRetroactiveAnalysis();

  // Lance l'analyse UNE SEULE FOIS au montage
  const hasStartedRef = useRef(false);
  
  useEffect(() => {
    // 🛡️ Protection contre les doubles appels
    if (hasStartedRef.current) return;
    if (analysisCompleted) return;
    if (!session?.user?.id) return;
    
    hasStartedRef.current = true;
    startAnalysis();
    // Volontairement pas de dépendance sur startAnalysis pour éviter les boucles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // 🚫 Si l'analyse est déjà faite OU en phase "skipped",
  // rediriger immédiatement vers la page principale
  useEffect(() => {
    if ((analysisCompleted || phase === 'skipped') && !results && !analysisLoading && !error) {
      console.log('[WelcomeScreen] Analyse déjà faite ou skipped - redirection automatique');
      if (onSkip) onSkip();
      router.push('/');
    }
  }, [analysisCompleted, phase, results, analysisLoading, error, onSkip, router]);

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      router.push('/onboarding');
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // Génère les confettis au montage (seulement si analyse terminée)
  useEffect(() => {
    if (analysisCompleted && !confetti.length) {
      const colors = ['#2383e2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      const pieces: ConfettiPiece[] = [];
      
      for (let i = 0; i < 50; i++) {
        pieces.push({
          id: i,
          left: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 2,
          duration: 2 + Math.random() * 2,
        });
      }
      
      setConfetti(pieces);
    }
    
    // Déclenche l'animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [analysisCompleted, confetti.length]);

  // Extrait le prénom de l'utilisateur
  const firstName = session?.user?.name?.split(' ')[0] || 'toi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-notion-sidebar/95 backdrop-blur-sm">
      {/* Confetti - seulement après analyse */}
      {analysisCompleted && confetti.map((piece) => (
        <div
          key={piece.id}
          className="confetti rounded-sm"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}

      {/* Card principale */}
      <div 
        className={`
          relative z-10 max-w-lg w-full mx-6 p-8 rounded-3xl
          bg-notion-bg border border-notion-border shadow-2xl
          transition-all duration-700 ease-out
          ${isVisible 
            ? 'opacity-100 transform translate-y-0 scale-100' 
            : 'opacity-0 transform translate-y-8 scale-95'
          }
        `}
      >
        {/* Phase: Analyse en cours */}
        {analysisLoading && !analysisCompleted && (
          <>
            {/* Icône animée - Calendrier */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-notion-blue to-blue-600 
                              flex items-center justify-center shadow-lg shadow-notion-blue/30
                              animate-pulse">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-notion-bg rounded-full 
                              flex items-center justify-center border-2 border-notion-border">
                  <Loader2 className="w-4 h-4 text-notion-blue animate-spin" />
                </div>
              </div>
            </div>

            {/* Message d'analyse */}
            <div className="text-center space-y-4 mb-6">
              <h1 className="text-2xl font-bold text-notion-text">
                Bienvenue, {firstName} !
              </h1>
              <p className="text-notion-textLight">
                {message || 'Analyse de ton calendrier en cours...'}
              </p>
            </div>

            {/* Barre de progression */}
            <div className="mb-6">
              <div className="h-2 bg-notion-sidebar rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-notion-blue to-blue-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-notion-textLight mt-2 text-center">
                {Math.round(progress)}% - {phase === 'fetching' && 'Récupération des événements'}
                {phase === 'classifying' && 'Classification IA'}
                {phase === 'calculating' && 'Calcul des points'}
                {phase === 'saving' && 'Finalisation'}
              </p>
            </div>

            {/* Indication */}
            <p className="text-sm text-center text-notion-textLight">
              On analyse tes 3 derniers mois pour te donner des points de départ 🎯
            </p>
          </>
        )}

        {/* Phase: Analyse terminée avec résultats */}
        {analysisCompleted && results && (
          <>
            {/* Icône animée */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 
                              flex items-center justify-center shadow-lg shadow-green-500/30
                              animate-float">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            {/* Titre et message */}
            <div className="text-center space-y-3 mb-6">
              <h1 className="text-3xl font-bold text-notion-text">
                Bienvenue, {firstName} !
              </h1>
              <p className="text-lg text-green-600 font-semibold">
                🎉 {results.totalPoints} points de départ !
              </p>
              <p className="text-notion-textLight">
                On a analysé <span className="font-semibold text-notion-text">{results.totalEvents} événements</span> de ton calendrier
              </p>
            </div>

            {/* Stats par catégorie */}
            <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-notion-sidebar rounded-xl">
              {Object.entries(results.byCategory).map(([category, data]) => (
                data.count > 0 && (
                  <div key={category} className="text-center p-2">
                    <div className="text-lg font-bold text-notion-text">
                      {category === 'studies' && '📚'}
                      {category === 'sport' && '🏃'}
                      {category === 'pro' && '💼'}
                      {category === 'personal' && '🏠'}
                      {' '}{data.points} pts
                    </div>
                    <div className="text-xs text-notion-textLight">
                      {data.count} {category === 'studies' ? 'révisions' : category === 'sport' ? 'entraînements' : category === 'pro' ? 'réunions' : 'événements'}
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Trophy Level */}
            {results.trophyLevel && (
              <div className="flex items-center justify-center gap-3 mb-6 p-3 bg-notion-blue/10 rounded-xl">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-sm font-semibold text-notion-text">
                    Niveau {results.trophyLevel.level} - {results.trophyLevel.name}
                  </p>
                  <div className="w-32 h-1.5 bg-notion-sidebar rounded-full mt-1">
                    <div 
                      className="h-full bg-notion-blue rounded-full"
                      style={{ width: `${results.trophyLevel.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Message et boutons d'action */}
            <p className="text-center text-notion-textLight mb-4">
              Que veux-tu faire maintenant ?
            </p>

            {/* Boutons d'action principaux */}
            <div className="space-y-3">
              {/* Bouton principal : Configurer profil */}
              <button
                onClick={handleContinue}
                className="group w-full flex items-center justify-center gap-3 
                         px-6 py-4 rounded-xl font-semibold
                         bg-gradient-to-r from-notion-blue to-blue-600 text-white
                         hover:from-notion-blue/90 hover:to-blue-600/90
                         shadow-lg shadow-notion-blue/25 hover:shadow-xl
                         transition-all duration-300"
              >
                <Rocket className="w-5 h-5" />
                <span>Configurer mon profil</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Bouton secondaire : Aller directement à Tempo */}
              <button
                onClick={() => {
                  if (onSkip) onSkip();
                  router.push('/');
                }}
                className="group w-full flex items-center justify-center gap-3 
                         px-6 py-3 rounded-xl font-medium
                         bg-notion-sidebar text-notion-text border border-notion-border
                         hover:bg-notion-hover hover:border-notion-blue/50
                         transition-all duration-300"
              >
                <Calendar className="w-5 h-5 text-notion-textLight group-hover:text-notion-blue" />
                <span>Aller sur Tempo</span>
              </button>

              {/* Bouton tertiaire : Voir progression */}
              <button
                onClick={() => {
                  if (onSkip) onSkip();
                  router.push('/progression');
                }}
                className="w-full py-2 text-sm text-notion-textLight 
                         hover:text-notion-blue transition-colors flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Voir ma progression détaillée</span>
              </button>
            </div>
          </>
        )}

        {/* Phase: Analyse terminée SANS résultats (calendrier vide) */}
        {analysisCompleted && !results && (
          <>
            {/* Icône animée */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-notion-blue to-blue-600 
                              flex items-center justify-center shadow-lg shadow-notion-blue/30
                              animate-float">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            {/* Titre et message */}
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-3xl font-bold text-notion-text">
                Bienvenue, {firstName} !
              </h1>
              <p className="text-lg text-notion-textLight leading-relaxed">
                Prêt à <span className="text-notion-blue font-semibold">gamifier ton planning</span> ?
              </p>
              <p className="text-notion-textLight">
                Ton calendrier est vide pour le moment - c&apos;est le moment idéal pour démarrer !
              </p>
            </div>

            {/* Stats preview */}
            <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-notion-sidebar rounded-xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-notion-blue">🎯</div>
                <div className="text-xs text-notion-textLight mt-1">Objectifs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-notion-blue">🏆</div>
                <div className="text-xs text-notion-textLight mt-1">Badges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-notion-blue">📈</div>
                <div className="text-xs text-notion-textLight mt-1">Progression</div>
              </div>
            </div>

            {/* Bouton CTA */}
            <button
              onClick={handleContinue}
              className="group w-full flex items-center justify-center gap-3 
                       px-6 py-4 rounded-xl font-semibold
                       bg-gradient-to-r from-notion-blue to-blue-600 text-white
                       hover:from-notion-blue/90 hover:to-blue-600/90
                       shadow-lg shadow-notion-blue/25 hover:shadow-xl
                       transition-all duration-300"
            >
              <Rocket className="w-5 h-5" />
              <span>C&apos;est parti !</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Skip option */}
            {onSkip && (
              <button
                onClick={handleSkip}
                className="w-full mt-4 py-2 text-sm text-notion-textLight 
                         hover:text-notion-text transition-colors"
              >
                Configurer plus tard
              </button>
            )}
          </>
        )}

        {/* Phase: Erreur */}
        {error && (
          <>
            {/* Icône */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-notion-blue to-blue-600 
                            flex items-center justify-center shadow-lg shadow-notion-blue/30
                            animate-float">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="text-center space-y-4 mb-8">
              <h1 className="text-3xl font-bold text-notion-text">
                Bienvenue, {firstName} !
              </h1>
              <p className="text-notion-textLight">
                On n&apos;a pas pu analyser ton calendrier, mais pas de souci !
              </p>
              <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                {error}
              </p>
            </div>

            {/* Bouton CTA */}
            <button
              onClick={handleContinue}
              className="group w-full flex items-center justify-center gap-3 
                       px-6 py-4 rounded-xl font-semibold
                       bg-gradient-to-r from-notion-blue to-blue-600 text-white
                       hover:from-notion-blue/90 hover:to-blue-600/90
                       shadow-lg shadow-notion-blue/25 hover:shadow-xl
                       transition-all duration-300"
            >
              <Rocket className="w-5 h-5" />
              <span>Continuer quand même</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Skip option */}
            {onSkip && (
              <button
                onClick={handleSkip}
                className="w-full mt-4 py-2 text-sm text-notion-textLight 
                         hover:text-notion-text transition-colors"
              >
                Configurer plus tard
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
