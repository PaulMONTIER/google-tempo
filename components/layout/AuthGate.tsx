'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Calendar, Trophy, Brain, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * Landing Page - Écran de connexion attractif avec présentation de Tempo
 * Objectif: Convaincre l'utilisateur de connecter son compte Google
 */

const features = [
  {
    icon: Calendar,
    title: 'Calendrier intelligent',
    description: 'Synchronisation Google Calendar avec classification automatique',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    description: 'Gagne des points et badges en atteignant tes objectifs',
  },
  {
    icon: Brain,
    title: 'Assistant IA',
    description: 'Crée et organise tes événements en langage naturel',
  },
  {
    icon: Zap,
    title: 'Préparation exams',
    description: 'Plans de révision personnalisés et rappels intelligents',
  },
];

const benefits = [
  'Organise tes révisions efficacement',
  'Suis ta progression avec des stats',
  'Développe tes savoirs-être',
  'Atteins tes objectifs académiques',
];

export function AuthGate() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen landing-gradient overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-notion-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-notion-blue/5 rounded-full blur-3xl animate-float stagger-2" />
      </div>

      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 animate-on-mount animate-slide-down">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-notion-blue flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-semibold text-notion-text">Tempo</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Hero section */}
            <div className="space-y-8">
              <div className="space-y-4 animate-on-mount animate-slide-up">
                <p className="text-sm font-medium text-notion-blue uppercase tracking-wider">
                  Pour les étudiants ambitieux
                </p>
                <h1 className="text-4xl lg:text-5xl font-bold text-notion-text leading-tight">
                  Comment obtenir un{' '}
                  <span className="text-notion-blue">A</span> ?
                </h1>
                <p className="text-lg text-notion-textLight leading-relaxed">
                  Tempo est ton assistant personnel qui gamifie ton planning 
                  et t&apos;aide à atteindre tes objectifs académiques.
                </p>
              </div>

              {/* Benefits list */}
              <ul className="space-y-3 animate-on-mount animate-slide-up stagger-2">
                {benefits.map((benefit, index) => (
                  <li 
                    key={index}
                    className="flex items-center gap-3 text-notion-text"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="animate-on-mount animate-slide-up stagger-3">
                <button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 
                           bg-notion-blue text-white font-semibold rounded-xl
                           hover:bg-notion-blue/90 transition-all duration-300
                           shadow-lg shadow-notion-blue/25 hover:shadow-xl hover:shadow-notion-blue/30
                           disabled:opacity-70 disabled:cursor-not-allowed
                           animate-pulse-glow"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Continuer avec Google</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="mt-4 text-sm text-notion-textLight">
                  Tempo accède à ton calendrier pour t&apos;aider à planifier.
                  <br />
                  Tes données restent privées et sécurisées.
                </p>
              </div>
            </div>

            {/* Right: Features grid */}
            <div className="grid grid-cols-2 gap-4 animate-on-mount animate-scale-in stagger-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-notion-blue/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-notion-blue" />
                  </div>
                  <h3 className="font-semibold text-notion-text mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-notion-textLight">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-sm text-notion-textLight animate-on-mount animate-fade-in stagger-5">
          <p>
            Fait avec passion pour les étudiants qui visent l&apos;excellence
          </p>
        </footer>
      </div>
    </div>
  );
}
