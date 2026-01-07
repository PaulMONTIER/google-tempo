'use client';

import { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, Zap, BookOpen } from 'lucide-react';
import { useSkills } from '@/hooks/use-skills';
import { useUserProgress } from '@/hooks/use-user-progress';

interface Quest {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    progress: number;
    total: number;
    isCompleted: boolean;
    type: 'daily' | 'weekly';
    skillId?: string;
    icon?: any;
}

export function QuestsTab() {
    const { skills } = useSkills();
    const { stats } = useUserProgress();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Charger les quêtes depuis l'API
    useEffect(() => {
        const fetchQuests = async () => {
            try {
                const res = await fetch('/api/gamification/quests');
                if (res.ok) {
                    const data = await res.json();

                    // Mapper les données API vers l'interface Quest du composant
                    const mappedQuests: Quest[] = data.map((q: any) => ({
                        id: q.id,
                        title: q.title,
                        description: q.description,
                        xpReward: q.xpReward,
                        progress: q.progress,
                        total: q.total,
                        isCompleted: q.status === 'COMPLETED',
                        type: q.type === 'DAILY' ? 'daily' : 'weekly',
                        skillId: q.skillId,
                        // Icône déduite
                        icon: q.title.includes('Assiduité') ? Zap :
                            q.title.includes('Productivité') ? CheckCircle :
                                q.title.includes('Révision') || q.title.includes('Session') ? BookOpen :
                                    q.title.includes('Focus') ? Target : Clock
                    }));
                    setQuests(mappedQuests);
                }
            } catch (error) {
                console.error('Erreur chargement quêtes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuests();
    }, [skills]); // Refetch si les skills changent (potentiellement de nouvelles quêtes dispos)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-blue" />
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {/* Hero Card */}
            <div className="p-6 rounded-xl border border-notion-border bg-notion-bg relative overflow-hidden">
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-notion-textLight uppercase tracking-wide">Quêtes actives</p>
                        <h2 className="text-2xl font-semibold text-notion-text mt-1">
                            {quests.filter(q => !q.isCompleted).length} disponibles
                        </h2>
                        <p className="text-sm text-notion-textLight">
                            Gagnez de l'XP en complétant vos objectifs
                        </p>
                    </div>
                </div>
            </div>

            {/* Liste des quêtes */}
            <div className="space-y-4">
                {/* Quêtes Journalières */}
                <div>
                    <h3 className="text-sm font-medium text-notion-textLight mb-3 uppercase tracking-wider">
                        Journalières
                    </h3>
                    <div className="space-y-3">
                        {quests.filter(q => q.type === 'daily').map(quest => (
                            <QuestCard key={quest.id} quest={quest} />
                        ))}
                    </div>
                </div>

                {/* Quêtes Hebdomadaires (basées sur les compétences) */}
                <div>
                    <h3 className="text-sm font-medium text-notion-textLight mb-3 uppercase tracking-wider">
                        Hebdomadaires
                    </h3>
                    <div className="space-y-3">
                        {quests.filter(q => q.type === 'weekly').map(quest => (
                            <QuestCard key={quest.id} quest={quest} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuestCard({ quest }: { quest: Quest }) {
    const Icon = quest.icon || Target;
    const progressPercent = Math.min(100, (quest.progress / quest.total) * 100);

    return (
        <div className={`p-4 rounded-xl border transition-all ${quest.isCompleted
            ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10'
            : 'border-notion-border bg-notion-bg hover:border-notion-textLight/30'
            }`}>
            <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${quest.isCompleted ? 'bg-green-100 text-green-600' : 'bg-notion-sidebar text-notion-textLight'
                    }`}>
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-medium ${quest.isCompleted ? 'text-green-800 dark:text-green-400' : 'text-notion-text'}`}>
                            {quest.title}
                        </h4>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${quest.isCompleted
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                            +{quest.xpReward} XP
                        </span>
                    </div>

                    <p className="text-sm text-notion-textLight mb-3">
                        {quest.description}
                    </p>

                    {/* Barre de progression */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-notion-sidebar rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${quest.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-notion-textLight">
                            {quest.progress}/{quest.total}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
