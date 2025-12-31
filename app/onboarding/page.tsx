'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { OnboardingFlow, OnboardingData } from '@/components/onboarding/OnboardingFlow';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  // Redirige si pas authentifié
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      // Vérifie si l'onboarding est déjà complété
      fetch('/api/onboarding/status')
        .then(res => res.json())
        .then(data => {
          if (data.completed) {
            router.push('/');
          } else {
            setIsLoading(false);
          }
        })
        .catch(() => setIsLoading(false));
    }
  }, [status, router]);

  const handleComplete = async (data: OnboardingData) => {
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Redirige directement vers Tempo (pas d'analyse - elle est déjà faite)
        window.location.href = '/';
      } else {
        const error = await response.json();
        console.error('Erreur onboarding:', error);
        alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
    }
  };

  const handleSkip = async () => {
    try {
      const response = await fetch('/api/onboarding/skip', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        console.error('Erreur skip onboarding');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-notion-sidebar flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-notion-blue/30 border-t-notion-blue rounded-full animate-spin" />
          <p className="text-notion-textLight">Chargement...</p>
        </div>
      </div>
    );
  }

  return <OnboardingFlow onComplete={handleComplete} onSkip={handleSkip} />;
}

