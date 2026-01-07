'use client';

import { useState } from 'react';
import { Calendar, BookOpen, Dumbbell, RefreshCw, Clock, Plus, Loader2, Check, Lightbulb, Youtube, ExternalLink, HelpCircle, ListChecks, Sparkles } from 'lucide-react';
import { RevisionPlan, RevisionSession } from '@/types/integrations';

interface RevisionPlanCardProps {
    plan: RevisionPlan;
    onAddToCalendar: (sessions: RevisionSession[]) => Promise<void>;
    onDismiss?: () => void;
}

/**
 * Carte affichant le programme de révision généré
 * Permet d'ajouter les sessions au calendrier
 */
export function RevisionPlanCard({
    plan,
    onAddToCalendar,
    onDismiss,
}: RevisionPlanCardProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<Set<number>>(
        new Set(plan.sessions.map((_, i) => i))
    );

    const handleAddAll = async () => {
        setIsAdding(true);
        try {
            const sessionsToAdd = plan.sessions.filter((_, i) => selectedSessions.has(i));
            await onAddToCalendar(sessionsToAdd);
            setIsAdded(true);
        } catch (error) {
            console.error('Error adding sessions to calendar:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const toggleSession = (index: number) => {
        setSelectedSessions((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'study':
                return <BookOpen className="w-4 h-4" />;
            case 'exercise':
                return <Dumbbell className="w-4 h-4" />;
            case 'review':
                return <RefreshCw className="w-4 h-4" />;
            case 'practice':
                return <Calendar className="w-4 h-4" />;
            default:
                return <BookOpen className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'study':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            case 'exercise':
                return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
            case 'review':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
            case 'practice':
                return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    // Grouper les sessions par date
    const sessionsByDate = plan.sessions.reduce((acc, session, index) => {
        if (!acc[session.date]) {
            acc[session.date] = [];
        }
        acc[session.date].push({ ...session, index });
        return acc;
    }, {} as Record<string, (RevisionSession & { index: number })[]>);

    return (
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-purple-500/20 bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-purple-500" />
                        <h3 className="font-semibold text-notion-text">
                            Programme de révision
                        </h3>
                    </div>
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="text-notion-textLight hover:text-notion-text text-sm"
                        >
                            Fermer
                        </button>
                    )}
                </div>
                <p className="text-sm text-notion-textLight">
                    {plan.summary}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-notion-textLight">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {plan.totalDays} jours
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {plan.sessions.length} sessions
                    </span>
                    {plan.pedagogy && (
                        <span className="flex items-center gap-1 text-indigo-500 font-medium">
                            <Sparkles className="w-3 h-3" />
                            Enrichi par IA
                        </span>
                    )}
                </div>
            </div>

            {/* Pedagogy Pack Summary (if exists) */}
            {plan.pedagogy && (
                <div className="px-4 py-3 bg-indigo-500/5 border-b border-purple-500/10">
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        <span className="font-semibold">Note de l'assistant :</span> {plan.pedagogy.summary}
                    </p>
                </div>
            )}

            {/* Sessions list */}
            <div className="p-3 max-h-80 overflow-y-auto space-y-4">
                {Object.entries(sessionsByDate).map(([date, sessions]) => (
                    <div key={date}>
                        <p className="text-xs font-medium text-notion-textLight mb-2 uppercase tracking-wide">
                            {formatDate(date)}
                        </p>
                        <div className="space-y-2">
                            {sessions.map((session) => (
                                <button
                                    key={session.index}
                                    onClick={() => !isAdded && toggleSession(session.index)}
                                    disabled={isAdded}
                                    className={`
                    w-full flex items-start gap-3 p-3 rounded-lg text-left
                    transition-all duration-200 bg-white dark:bg-gray-800
                    ${selectedSessions.has(session.index) && !isAdded
                                            ? 'border-2 border-purple-500/50'
                                            : 'border border-notion-border'
                                        }
                    ${isAdded ? 'opacity-75' : 'hover:border-purple-500/30'}
                  `}
                                >
                                    {/* Checkbox */}
                                    {!isAdded && (
                                        <div
                                            className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                        ${selectedSessions.has(session.index)
                                                    ? 'bg-purple-500 border-purple-500'
                                                    : 'border-notion-border'
                                                }
                      `}
                                        >
                                            {selectedSessions.has(session.index) && (
                                                <Check className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                    )}

                                    {/* Type icon */}
                                    <div className={`p-1.5 rounded-lg ${getTypeColor(session.type)}`}>
                                        {getTypeIcon(session.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-notion-text">
                                                {session.title}
                                            </p>
                                            <span className="text-xs text-notion-textLight">
                                                {session.duration}
                                            </span>
                                        </div>
                                        <p className="text-xs text-notion-textLight mt-1 line-clamp-2">
                                            {session.description}
                                        </p>
                                        {session.exercises && session.exercises.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {session.exercises.map((ex, i) => (
                                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200/50">
                                                        {ex.difficulty === 'easy' ? '🟢' : ex.difficulty === 'medium' ? '🟡' : '🔴'} {ex.title}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Playlist & QCM Section */}
            {plan.pedagogy && (
                <div className="p-3 border-t border-purple-500/10 space-y-4 bg-white/30 dark:bg-gray-800/30">
                    {/* Playlist */}
                    {plan.pedagogy.playlist.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Youtube className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-semibold text-notion-text uppercase tracking-wider">
                                    Playlist de révision
                                </span>
                            </div>
                            <div className="space-y-2">
                                {plan.pedagogy.playlist.map((video) => (
                                    <a
                                        key={video.id}
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-purple-500/20 group"
                                    >
                                        <div className="w-16 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0 relative">
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                                                <ExternalLink className="w-4 h-4 text-white" />
                                            </div>
                                            <img src={`https://img.youtube.com/vi/${video.id}/default.jpg`} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-notion-text truncate">
                                                {video.title}
                                            </p>
                                            <p className="text-[10px] text-notion-textLight truncate">
                                                {video.metadata.author} • {Math.round(video.qualityScore * 100)}% qualité
                                            </p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* QCM Preview */}
                    {plan.pedagogy.qcm.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <HelpCircle className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-semibold text-notion-text uppercase tracking-wider">
                                    Quiz d'auto-évaluation
                                </span>
                            </div>
                            <div className="p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                                <p className="text-[11px] text-notion-textLight italic">
                                    {plan.pedagogy.qcm.length} questions générées pour tester tes connaissances.
                                    Les questions seront incluses dans la session de synthèse.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tips */}
            {plan.tips.length > 0 && (
                <div className="p-3 border-t border-purple-500/20 bg-yellow-50/50 dark:bg-yellow-900/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                            Conseils
                        </span>
                    </div>
                    <ul className="text-xs text-notion-textLight space-y-1">
                        {plan.tips.slice(0, 3).map((tip, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-notion-textLight">•</span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-purple-500/20 bg-white/50 dark:bg-gray-800/50">
                {isAdded ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 py-2">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Sessions ajoutées au calendrier !</span>
                    </div>
                ) : (
                    <button
                        onClick={handleAddAll}
                        disabled={isAdding || selectedSessions.size === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 
                       bg-purple-600 text-white rounded-lg hover:bg-purple-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all font-medium"
                    >
                        {isAdding ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Ajout en cours...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Ajouter {selectedSessions.size} session(s) au calendrier
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
