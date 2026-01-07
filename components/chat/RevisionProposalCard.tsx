'use client';

import { Check, X, Sparkles } from 'lucide-react';

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
        <div className="bg-notion-bg rounded-xl border border-notion-border overflow-hidden shadow-lg">
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-9 h-9 bg-notion-blue/15 rounded-lg flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-notion-blue" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-notion-text mb-1">
                            Programme de révision ?
                        </h3>
                        <p className="text-sm text-notion-textLight mb-3">
                            J'ai ajouté <strong className="text-notion-text">{eventTitle}</strong> au calendrier pour le {formatDate(eventDate)}.
                            Souhaites-tu que je te prépare un programme de révision sur mesure ?
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={onAccept}
                                className="flex items-center gap-2 px-4 py-2 bg-notion-blue text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
                            >
                                <Check className="w-4 h-4" />
                                Oui, préparer le plan
                            </button>

                            <button
                                onClick={onDecline}
                                className="flex items-center gap-2 px-4 py-2 bg-notion-sidebar text-notion-textLight border border-notion-border rounded-lg text-sm font-medium hover:bg-notion-hover hover:text-notion-text transition-all"
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
