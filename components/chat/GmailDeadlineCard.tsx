'use client';

import { useState } from 'react';
import { Calendar, AlertTriangle, Clock, Check, Plus, Loader2, Mail, Youtube, Globe, Sparkles } from 'lucide-react';
import { DetectedDeadline } from '@/types/integrations';

interface GmailDeadlineCardProps {
    deadlines: DetectedDeadline[];
    onAddToCalendar: (deadline: DetectedDeadline) => Promise<void>;
    onDismiss?: () => void;
}

/**
 * Carte affichant les deadlines détectées dans Gmail
 * Permet d'ajouter les événements au calendrier
 */
export function GmailDeadlineCard({
    deadlines,
    onAddToCalendar,
    onDismiss,
}: GmailDeadlineCardProps) {
    const [addingIndex, setAddingIndex] = useState<number | null>(null);
    const [addedIndexes, setAddedIndexes] = useState<Set<number>>(new Set());

    const handleAdd = async (deadline: DetectedDeadline, index: number) => {
        setAddingIndex(index);
        try {
            await onAddToCalendar(deadline);
            setAddedIndexes((prev) => new Set(prev).add(index));
        } catch (error) {
            console.error('Error adding deadline to calendar:', error);
        } finally {
            setAddingIndex(null);
        }
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'high':
                return 'text-red-500 bg-red-50 dark:bg-red-900/20';
            case 'medium':
                return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
            case 'low':
                return 'text-green-500 bg-green-50 dark:bg-green-900/20';
            default:
                return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    const getUrgencyLabel = (urgency: string) => {
        switch (urgency) {
            case 'high':
                return 'Urgent';
            case 'medium':
                return 'Moyen';
            case 'low':
                return 'Faible';
            default:
                return urgency;
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            });
        } catch {
            return dateStr;
        }
    };

    if (deadlines.length === 0) {
        return (
            <div className="bg-notion-sidebar rounded-xl p-4 border border-notion-border">
                <div className="flex items-center gap-3 text-notion-textLight">
                    <Mail className="w-5 h-5" />
                    <p className="text-sm">Aucune deadline détectée dans vos emails récents.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl border border-red-500/20 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-red-500/20 bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold text-notion-text">
                            Deadlines détectées
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                            {deadlines.length}
                        </span>
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
            </div>

            {/* Liste des deadlines */}
            <div className="p-2 space-y-2 max-h-80 overflow-y-auto">
                {deadlines.map((deadline, index) => {
                    const isAdded = addedIndexes.has(index);
                    const isAdding = addingIndex === index;

                    return (
                        <div
                            key={index}
                            className={`
                p-3 rounded-lg bg-white dark:bg-gray-800 border
                ${isAdded ? 'border-green-500/50' : 'border-notion-border'}
                transition-all duration-200
              `}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-notion-text truncate">
                                            {deadline.title}
                                        </h4>
                                        <span
                                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getUrgencyColor(
                                                deadline.urgency
                                            )}`}
                                        >
                                            {getUrgencyLabel(deadline.urgency)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-notion-textLight">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(deadline.date)}
                                        </span>
                                    </div>

                                    {deadline.description && (
                                        <p className="text-xs text-notion-textLight mt-1 line-clamp-2">
                                            {deadline.description}
                                        </p>
                                    )}

                                    <p className="text-xs text-notion-textLight mt-1 italic truncate">
                                        Source: {deadline.sourceSubject}
                                    </p>

                                    {/* Suggested Resources Preview */}
                                    {deadline.suggestedResources && deadline.suggestedResources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-notion-border">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                                                    Ressources suggérées
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {deadline.suggestedResources.slice(0, 3).map((res, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-900 border border-notion-border max-w-[150px]">
                                                        {res.type === 'youtube' ? (
                                                            <Youtube className="w-3 h-3 text-red-500" />
                                                        ) : (
                                                            <Globe className="w-3 h-3 text-blue-400" />
                                                        )}
                                                        <span className="text-[10px] text-notion-text truncate">
                                                            {res.title}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleAdd(deadline, index)}
                                    disabled={isAdded || isAdding}
                                    className={`
                    flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 flex-shrink-0
                    ${isAdded
                                            ? 'bg-green-500 text-white cursor-default'
                                            : 'bg-notion-blue text-white hover:opacity-90'
                                        }
                    ${isAdding ? 'opacity-50 cursor-wait' : ''}
                  `}
                                >
                                    {isAdding ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isAdded ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Ajouté
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Ajouter
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
