'use client';

import { Calendar, Check, X, Sparkles } from 'lucide-react';

interface RevisionProposalCardProps {
    eventTitle: string;
    eventDate: string;
    onAccept: () => void;
    onDecline: () => void;
}

export function RevisionProposalCard({
    eventTitle,
    eventDate,
    onAccept,
    onDecline,
}: RevisionProposalCardProps) {
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20 overflow-hidden animate-fade-in">
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-semibold text-notion-text mb-1">
                            Programme de révision ?
                        </h3>
                        <p className="text-sm text-notion-textLight mb-3">
                            J'ai ajouté <strong>{eventTitle}</strong> au calendrier pour le {formatDate(eventDate)}.
                            Souhaites-tu que je te prépare un programme de révision sur mesure ?
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={onAccept}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
                            >
                                <Check className="w-4 h-4" />
                                Oui, préparer le plan
                            </button>

                            <button
                                onClick={onDecline}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-notion-textLight border border-notion-border rounded-lg text-sm font-medium hover:bg-notion-hover transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Non merci
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
