'use client';

import { useState } from 'react';
import { Calendar, Check, Plus, Loader2, Mail, ChevronRight } from 'lucide-react';
import { DetectedDeadline } from '@/types/integrations';

interface GmailDeadlineCardProps {
    deadlines: DetectedDeadline[];
    onAddToCalendar: (deadline: DetectedDeadline) => Promise<void>;
    onDismiss?: () => void;
}

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

    const getUrgencyStyle = (urgency: string) => {
        switch (urgency) {
            case 'high': return 'bg-red-500/15 text-red-500';
            case 'medium': return 'bg-orange-500/15 text-orange-500';
            case 'low': return 'bg-green-500/15 text-green-500';
            default: return 'bg-notion-hover text-notion-textLight';
        }
    };

    const getUrgencyLabel = (urgency: string) => {
        switch (urgency) {
            case 'high': return 'Urgent';
            case 'medium': return 'Moyen';
            case 'low': return 'Faible';
            default: return urgency;
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
            });
        } catch {
            return dateStr;
        }
    };

    if (deadlines.length === 0) {
        return (
            <div className="bg-notion-bg rounded-xl p-4 border border-notion-border">
                <div className="flex items-center gap-3 text-notion-textLight">
                    <Mail className="w-5 h-5" />
                    <p className="text-sm">Aucune deadline détectée dans vos emails récents.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-notion-bg rounded-xl border border-notion-border overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-5 py-4 border-b border-notion-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-500/15 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-notion-text text-sm">
                            Deadlines détectées
                        </h3>
                        <p className="text-xs text-notion-textLight">
                            {deadlines.length} deadline{deadlines.length > 1 ? 's' : ''} dans vos emails
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

            {/* Deadlines List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-notion-border/50">
                {deadlines.map((deadline, index) => {
                    const isAdded = addedIndexes.has(index);
                    const isAdding = addingIndex === index;

                    return (
                        <div
                            key={index}
                            className={`px-5 py-4 transition-colors ${isAdded ? 'bg-green-500/5' : 'hover:bg-notion-hover'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Title & Urgency */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-sm text-notion-text truncate">
                                            {deadline.title}
                                        </h4>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${getUrgencyStyle(deadline.urgency)}`}>
                                            {getUrgencyLabel(deadline.urgency)}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <div className="flex items-center gap-1.5 text-xs text-notion-textLight mb-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatDate(deadline.date)}</span>
                                    </div>

                                    {/* Source */}
                                    <p className="text-xs text-notion-textLight truncate">
                                        {deadline.sourceSubject}
                                    </p>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => handleAdd(deadline, index)}
                                    disabled={isAdded || isAdding}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shrink-0 transition-all ${isAdded
                                            ? 'bg-green-500 text-white'
                                            : 'bg-notion-blue text-white hover:opacity-90'
                                        } disabled:cursor-default`}
                                >
                                    {isAdding ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : isAdded ? (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Ajouté</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Ajouter</span>
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
