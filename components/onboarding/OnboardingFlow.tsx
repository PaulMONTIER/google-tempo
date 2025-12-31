'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { SummaryScreen } from './SummaryScreen';

// Questions
import { PrioritiesQuestion } from './questions/PrioritiesQuestion';
import { SubjectsQuestion } from './questions/SubjectsQuestion';
import { SportQuestion } from './questions/SportQuestion';
import { SoftSkillsQuestion } from './questions/SoftSkillsQuestion';
import { NotificationTimeQuestion } from './questions/NotificationTimeQuestion';
import { ToneQuestion } from './questions/ToneQuestion';
import { IntegrationsQuestion } from './questions/IntegrationsQuestion';

export interface OnboardingData {
  priorityActivities: string[];
  studySubjects: string[];
  sportDiscipline: string | null;
  targetSoftSkills: string[];
  dailyNotificationTime: string;
  messageTone: 'supportive' | 'pepTalk' | 'lightTrashTalk';
  sportIntegrations: string[];
}

interface OnboardingFlowProps {
  initialData?: Partial<OnboardingData>;
  onComplete: (data: OnboardingData) => Promise<void>;
  onSkip: () => Promise<void>;
}

type StepId = 'priorities' | 'subjects' | 'sport' | 'soft-skills' | 'notification-time' | 'tone' | 'integrations' | 'summary';

interface Step {
  id: StepId;
  title: string;
  condition?: (data: OnboardingData) => boolean;
}

const ALL_STEPS: Step[] = [
  { id: 'priorities', title: 'Activités prioritaires' },
  { id: 'subjects', title: 'Matières', condition: (d) => d.priorityActivities.includes('studies') },
  { id: 'sport', title: 'Sport', condition: (d) => d.priorityActivities.includes('sport') },
  { id: 'soft-skills', title: 'Savoirs-être' },
  { id: 'notification-time', title: 'Notifications' },
  { id: 'tone', title: 'Ton des messages' },
  { id: 'integrations', title: 'Intégrations', condition: (d) => d.priorityActivities.includes('sport') },
  { id: 'summary', title: 'Récapitulatif' },
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

export function OnboardingFlow({ initialData, onComplete, onSkip }: OnboardingFlowProps) {
  const [data, setData] = useState<OnboardingData>({ ...DEFAULT_DATA, ...initialData });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtre les étapes selon les conditions
  const activeSteps = ALL_STEPS.filter(step => !step.condition || step.condition(data));
  const currentStep = activeSteps[currentStepIndex];
  const isLastStep = currentStepIndex === activeSteps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (currentStep?.id) {
      case 'priorities':
        return data.priorityActivities.length > 0;
      case 'subjects':
        return data.studySubjects.length > 0;
      case 'sport':
        return data.sportDiscipline !== null;
      case 'soft-skills':
        return data.targetSoftSkills.length === 3;
      case 'notification-time':
        return data.dailyNotificationTime !== '';
      case 'tone':
        return data.messageTone !== null;
      case 'integrations':
        return true; // Optionnel
      case 'summary':
        return true;
      default:
        return false;
    }
  }, [currentStep?.id, data]);

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      setIsSubmitting(true);
      try {
        await onComplete(data);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStepIndex(prev => Math.min(prev + 1, activeSteps.length - 1));
    }
  }, [isLastStep, data, onComplete, activeSteps.length]);

  const handleBack = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSkip = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSkip();
    } finally {
      setIsSubmitting(false);
    }
  }, [onSkip]);

  const renderStep = () => {
    switch (currentStep?.id) {
      case 'priorities':
        return (
          <PrioritiesQuestion
            selected={data.priorityActivities}
            onChange={(priorityActivities) => updateData({ priorityActivities })}
          />
        );
      case 'subjects':
        return (
          <SubjectsQuestion
            selected={data.studySubjects}
            onChange={(studySubjects) => updateData({ studySubjects })}
          />
        );
      case 'sport':
        return (
          <SportQuestion
            selected={data.sportDiscipline}
            onChange={(sportDiscipline) => updateData({ sportDiscipline })}
          />
        );
      case 'soft-skills':
        return (
          <SoftSkillsQuestion
            selected={data.targetSoftSkills}
            onChange={(targetSoftSkills) => updateData({ targetSoftSkills })}
          />
        );
      case 'notification-time':
        return (
          <NotificationTimeQuestion
            value={data.dailyNotificationTime}
            onChange={(dailyNotificationTime) => updateData({ dailyNotificationTime })}
          />
        );
      case 'tone':
        return (
          <ToneQuestion
            selected={data.messageTone}
            onChange={(messageTone) => updateData({ messageTone })}
          />
        );
      case 'integrations':
        return (
          <IntegrationsQuestion
            selected={data.sportIntegrations}
            onChange={(sportIntegrations) => updateData({ sportIntegrations })}
          />
        );
      case 'summary':
        return <SummaryScreen data={data} onEdit={(stepId) => {
          const stepIndex = activeSteps.findIndex(s => s.id === stepId);
          if (stepIndex >= 0) setCurrentStepIndex(stepIndex);
        }} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-notion-sidebar flex flex-col">
      {/* Header avec progression */}
      <header className="p-6 border-b border-notion-border bg-notion-bg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-notion-blue flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-semibold text-notion-text">Configuration</span>
            </div>
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex items-center gap-1 text-sm text-notion-textLight hover:text-notion-text transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              Passer
            </button>
          </div>
          <ProgressBar 
            current={currentStepIndex + 1} 
            total={activeSteps.length} 
            labels={activeSteps.map(s => s.title)}
          />
        </div>
      </header>

      {/* Contenu de la question */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl animate-on-mount animate-fade-in">
          <QuestionCard>
            {renderStep()}
          </QuestionCard>
        </div>
      </main>

      {/* Footer avec navigation */}
      <footer className="p-6 border-t border-notion-border bg-notion-bg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={isFirstStep || isSubmitting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${isFirstStep 
                ? 'opacity-0 pointer-events-none' 
                : 'text-notion-textLight hover:text-notion-text hover:bg-notion-hover'
              }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
              ${canProceed() && !isSubmitting
                ? 'bg-notion-blue text-white hover:bg-notion-blue/90 shadow-lg shadow-notion-blue/25'
                : 'bg-notion-hover text-notion-textLight cursor-not-allowed'
              }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <span>{isLastStep ? 'Terminer' : 'Continuer'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}


