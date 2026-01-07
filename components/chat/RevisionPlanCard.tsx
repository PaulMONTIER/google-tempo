'use client';

import { useState } from 'react';
import { Calendar, BookOpen, Dumbbell, RefreshCw, Clock, Plus, Loader2, Check, Lightbulb, ChevronRight } from 'lucide-react';
import { RevisionPlan, RevisionSession } from '@/types/integrations';

interface RevisionPlanCardProps {
    plan: RevisionPlan;
    onAddToCalendar: (sessions: RevisionSession[]) => Promise<void>;
    onDismiss?: () => void;
}

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
            case 'study': return <BookOpen className="w-3.5 h-3.5" />;
            case 'exercise': return <Dumbbell className="w-3.5 h-3.5" />;
            case 'review': return <RefreshCw className="w-3.5 h-3.5" />;
            default: return <BookOpen className="w-3.5 h-3.5" />;
        }
    };

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'study': return 'bg-blue-500/15 text-blue-500';
            case 'exercise': return 'bg-green-500/15 text-green-500';
            case 'review': return 'bg-purple-500/15 text-purple-500';
            default: return 'bg-notion-hover text-notion-textLight';
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

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Grouper les sessions par date
    const sessionsByDate = plan.sessions.reduce((acc, session, index) => {
        const dateKey = session.date || session.start?.split('T')[0] || '';
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push({ ...session, index });
        return acc;
    }, {} as Record<string, (RevisionSession & { index: number })[]>);

    return (
        <div className="bg-notion-bg rounded-xl border border-notion-border overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-5 py-4 border-b border-notion-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-notion-blue/15 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-notion-blue" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-notion-text text-sm">
                            Programme de révision
                        </h3>
                        <p className="text-xs text-notion-textLight">
                            {plan.eventTitle} • {plan.sessions.length} sessions
                        </p>
                    </div>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-xs text-notion-textLight hover:text-notion-text transition-colors"
                    >
                        Fermer
                    </button>
                )}
            </div>

            {/* Summary */}
            {plan.summary && (
                <div className="px-5 py-3 bg-notion-sidebar/50 border-b border-notion-border">
                    <p className="text-xs text-notion-textLight leading-relaxed">
                        {plan.summary}
                    </p>
                </div>
            )}

            {/* Sessions Timeline */}
            <div className="max-h-72 overflow-y-auto">
                {Object.entries(sessionsByDate).map(([date, sessions]) => (
                    <div key={date} className="border-b border-notion-border last:border-b-0">
                        {/* Date Header */}
                        <div className="px-5 py-2.5 bg-notion-sidebar/30 sticky top-0">
                            <span className="text-xs font-medium text-notion-textLight uppercase tracking-wider">
                                {formatDate(date)}
                            </span>
                        </div>

                        {/* Sessions */}
                        <div className="divide-y divide-notion-border/50">
                            {sessions.map((session) => (
                                <button
                                    key={session.index}
                                    onClick={() => !isAdded && toggleSession(session.index)}
                                    disabled={isAdded}
                                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${isAdded ? 'opacity-60' : 'hover:bg-notion-hover'
                                        }`}
                                >
                                    {/* Checkbox */}
                                    {!isAdded && (
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedSessions.has(session.index)
                                                ? 'bg-notion-blue border-notion-blue'
                                                : 'border-notion-border'
                                            }`}>
                                            {selectedSessions.has(session.index) && (
                                                <Check className="w-2.5 h-2.5 text-white" />
                                            )}
                                        </div>
                                    )}

                                    {/* Type Icon */}
                                    <div className={`p-1.5 rounded-md shrink-0 ${getTypeStyle(session.type)}`}>
                                        {getTypeIcon(session.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-notion-text truncate">
                                                {session.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {session.start && (
                                                <span className="text-xs text-notion-textLight">
                                                    {formatTime(session.start)}
                                                </span>
                                            )}
                                            <span className="text-xs text-notion-textLight">
                                                • {session.duration}
                                            </span>
                                        </div>
                                    </div>

                                    <ChevronRight className="w-4 h-4 text-notion-textLight shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tips */}
            {plan.tips && plan.tips.length > 0 && (
                <div className="px-5 py-3 bg-yellow-500/5 border-t border-notion-border">
                    <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-notion-textLight">
                            {plan.tips[0]}
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="px-5 py-4 border-t border-notion-border bg-notion-sidebar/30">
                {isAdded ? (
                    <div className="flex items-center justify-center gap-2 text-green-500">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-medium">Sessions ajoutées au calendrier</span>
                    </div>
                ) : (
                    <button
                        onClick={handleAddAll}
                        disabled={isAdding || selectedSessions.size === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                            bg-notion-blue text-white rounded-lg text-sm font-medium
                            hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isAdding ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Ajout en cours...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Ajouter {selectedSessions.size} session{selectedSessions.size > 1 ? 's' : ''} au calendrier
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
