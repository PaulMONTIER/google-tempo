import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export type OnboardingStep = 
  | 'welcome'
  | 'priorities'
  | 'subjects'
  | 'sport'
  | 'soft-skills'
  | 'notification-time'
  | 'message-tone'
  | 'integrations'
  | 'summary'
  | 'completed';

interface OnboardingData {
  priorityActivities: string[];
  studySubjects: string[];
  sportDiscipline: string | null;
  targetSoftSkills: string[];
  dailyNotificationTime: string;
  messageTone: 'supportive' | 'pepTalk' | 'lightTrashTalk';
  sportIntegrations: string[];
}

interface UseOnboardingReturn {
  // État
  isLoading: boolean;
  currentStep: OnboardingStep;
  showWelcome: boolean;
  isCompleted: boolean;
  data: OnboardingData;
  
  // Actions
  setShowWelcome: (show: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  updateData: (updates: Partial<OnboardingData>) => void;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
}

const STEPS_ORDER: OnboardingStep[] = [
  'welcome',
  'priorities',
  'subjects',
  'sport',
  'soft-skills',
  'notification-time',
  'message-tone',
  'integrations',
  'summary',
  'completed',
];

const DEFAULT_DATA: OnboardingData = {
  priorityActivities: [],
  studySubjects: [],
  sportDiscipline: null,
  targetSoftSkills: [],
  dailyNotificationTime: '08:00',
  messageTone: 'supportive',
  sportIntegrations: [],
};

/**
 * Hook pour gérer le flux d'onboarding
 * Stocke l'état localement et synchronise avec le backend
 */
export function useOnboarding(): UseOnboardingReturn {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isCompleted, setIsCompleted] = useState(false);
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);

  // Charge l'état d'onboarding depuis le backend (UN SEUL appel API)
  useEffect(() => {
    async function fetchOnboardingStatus() {
      if (status !== 'authenticated' || !session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // UN SEUL appel API - contient maintenant retroactiveAnalysisDone
        const response = await fetch('/api/onboarding/status');
        
        // 🛡️ Gestion robuste des erreurs
        const result = response.ok 
          ? await response.json() 
          : { completed: false, retroactiveAnalysisDone: false };

        console.log('[useOnboarding] Status:', result);

        setIsCompleted(result.completed ?? false);

        // WelcomeScreen s'affiche SEULEMENT si :
        // L'analyse rétroactive n'a JAMAIS été faite (vérifié en BDD)
        const isFirstConnection = !result.retroactiveAnalysisDone;
        
        if (isFirstConnection) {
          console.log('[useOnboarding] 🎉 Première connexion détectée - Affichage WelcomeScreen');
          setShowWelcome(true);
          if (result.step) {
            setCurrentStep(result.step as OnboardingStep);
          }
          if (result.data) {
            setData(prev => ({ ...prev, ...result.data }));
          }
        } else {
          console.log('[useOnboarding] ✅ Analyse rétroactive déjà faite - Skip WelcomeScreen');
          setShowWelcome(false);
        }
      } catch (error) {
        console.error('[useOnboarding] Erreur (non-bloquante):', error);
        // 🛡️ Ne pas afficher le WelcomeScreen en cas d'erreur pour éviter les boucles
        setShowWelcome(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOnboardingStatus();
  }, [session?.user?.id, status]);

  const nextStep = useCallback(() => {
    const currentIndex = STEPS_ORDER.indexOf(currentStep);
    if (currentIndex < STEPS_ORDER.length - 1) {
      const nextStepValue = STEPS_ORDER[currentIndex + 1];
      
      // Skip l'étape subjects si études pas dans les priorités
      if (nextStepValue === 'subjects' && !data.priorityActivities.includes('studies')) {
        setCurrentStep('sport');
        return;
      }
      
      // Skip l'étape sport si sport pas dans les priorités
      if (nextStepValue === 'sport' && !data.priorityActivities.includes('sport')) {
        setCurrentStep('soft-skills');
        return;
      }
      
      // Skip l'étape integrations si sport pas dans les priorités
      if (nextStepValue === 'integrations' && !data.priorityActivities.includes('sport')) {
        setCurrentStep('summary');
        return;
      }
      
      setCurrentStep(nextStepValue);
    }
  }, [currentStep, data.priorityActivities]);

  const previousStep = useCallback(() => {
    const currentIndex = STEPS_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStepValue = STEPS_ORDER[currentIndex - 1];
      
      // Skip les mêmes étapes en arrière
      if (prevStepValue === 'integrations' && !data.priorityActivities.includes('sport')) {
        setCurrentStep('message-tone');
        return;
      }
      
      if (prevStepValue === 'sport' && !data.priorityActivities.includes('sport')) {
        setCurrentStep('subjects');
        return;
      }
      
      if (prevStepValue === 'subjects' && !data.priorityActivities.includes('studies')) {
        setCurrentStep('priorities');
        return;
      }
      
      setCurrentStep(prevStepValue);
    }
  }, [currentStep, data.priorityActivities]);

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const completeOnboarding = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsCompleted(true);
        setShowWelcome(false);
        setCurrentStep('completed');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  // Juste fermer le popup sans marquer comme complété
  // L'utilisateur verra le bandeau pour configurer plus tard
  const skipOnboarding = useCallback(async () => {
    setShowWelcome(false);
    // On garde isCompleted à false pour afficher le bandeau
  }, []);

  return {
    isLoading,
    currentStep,
    showWelcome,
    isCompleted,
    data,
    setShowWelcome,
    nextStep,
    previousStep,
    goToStep,
    updateData,
    completeOnboarding,
    skipOnboarding,
  };
}

