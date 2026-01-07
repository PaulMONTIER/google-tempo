'use client';

import { Edit2, GraduationCap, Dumbbell, Briefcase, Heart, Clock, MessageSquare } from 'lucide-react';
import type { OnboardingData } from './OnboardingFlow';

interface SummaryScreenProps {
  data: OnboardingData;
  onEdit: (stepId: string) => void;
}

const PRIORITY_LABELS: Record<string, { label: string; icon: typeof GraduationCap }> = {
  studies: { label: 'Études', icon: GraduationCap },
  sport: { label: 'Sport', icon: Dumbbell },
  pro: { label: 'Professionnel', icon: Briefcase },
  personal: { label: 'Personnel', icon: Heart },
};

const SOFT_SKILL_LABELS: Record<string, string> = {
  punctuality: '⏰ Ponctualité',
  perseverance: '🏔️ Persévérance',
  rigor: '📐 Rigueur',
  autonomy: '🦅 Autonomie',
  adaptability: '🌊 Adaptabilité',
  organization: '📋 Organisation',
  teamwork: '🤝 Travail en équipe',
  stress_management: '🧘 Gestion du stress',
};

const TONE_LABELS: Record<string, string> = {
  supportive: '💗 Bienveillant',
  pepTalk: '🔥 Pep Talk',
  lightTrashTalk: '⚡ Trash-talk léger',
};

export function SummaryScreen({ data, onEdit }: SummaryScreenProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-notion-text">
          Récapitulatif
        </h2>
        <p className="text-notion-textLight">
          Vérifie tes choix avant de terminer
        </p>
      </div>

      <div className="space-y-4">
        {/* Activités prioritaires */}
        <SummaryCard
          title="Activités prioritaires"
          onEdit={() => onEdit('priorities')}
        >
          <div className="flex flex-wrap gap-2">
            {data.priorityActivities.map(id => {
              const priority = PRIORITY_LABELS[id];
              if (!priority) return null;
              const Icon = priority.icon;
              return (
                <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-notion-blue/10 text-notion-blue text-sm">
                  <Icon className="w-4 h-4" />
                  {priority.label}
                </span>
              );
            })}
          </div>
        </SummaryCard>

        {/* Matières */}
        {data.studySubjects.length > 0 && (
          <SummaryCard
            title="Matières"
            onEdit={() => onEdit('subjects')}
          >
            <div className="flex flex-wrap gap-2">
              {data.studySubjects.map(subject => (
                <span key={subject} className="px-3 py-1.5 rounded-full bg-notion-hover text-notion-text text-sm">
                  {subject}
                </span>
              ))}
            </div>
          </SummaryCard>
        )}

        {/* Sport */}
        {data.sportDiscipline && (
          <SummaryCard
            title="Sport"
            onEdit={() => onEdit('sport')}
          >
            <span className="px-3 py-1.5 rounded-full bg-notion-hover text-notion-text text-sm capitalize">
              {data.sportDiscipline}
            </span>
          </SummaryCard>
        )}

        {/* Savoirs-être */}
        <SummaryCard
          title="Savoirs-être à développer"
          onEdit={() => onEdit('soft-skills')}
        >
          <div className="flex flex-wrap gap-2">
            {data.targetSoftSkills.map(id => (
              <span key={id} className="px-3 py-1.5 rounded-full bg-notion-hover text-notion-text text-sm">
                {SOFT_SKILL_LABELS[id] || id}
              </span>
            ))}
          </div>
        </SummaryCard>

        {/* Notifications */}
        <SummaryCard
          title="Message quotidien"
          onEdit={() => onEdit('notification-time')}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-notion-textLight" />
            <span className="text-notion-text">{data.dailyNotificationTime}</span>
          </div>
        </SummaryCard>

        {/* Ton */}
        <SummaryCard
          title="Ton des messages"
          onEdit={() => onEdit('tone')}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-notion-textLight" />
            <span className="text-notion-text">{TONE_LABELS[data.messageTone]}</span>
          </div>
        </SummaryCard>

        {/* Intégrations */}
        {data.sportIntegrations.length > 0 && (
          <SummaryCard
            title="Intégrations sport"
            onEdit={() => onEdit('integrations')}
          >
            <div className="flex flex-wrap gap-2">
              {data.sportIntegrations.map(id => (
                <span key={id} className="px-3 py-1.5 rounded-full bg-notion-hover text-notion-text text-sm capitalize">
                  {id}
                </span>
              ))}
            </div>
          </SummaryCard>
        )}
      </div>

      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <p className="text-center text-green-700 dark:text-green-400">
          🎉 Tout est prêt ! Clique sur &quot;Terminer&quot; pour commencer à utiliser Tempo.
        </p>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}

function SummaryCard({ title, children, onEdit }: SummaryCardProps) {
  return (
    <div className="p-4 rounded-xl border border-notion-border bg-notion-sidebar">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-notion-text">{title}</h3>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-sm text-notion-textLight hover:text-notion-blue transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          Modifier
        </button>
      </div>
      {children}
    </div>
  );
}


