'use client';

import { useState } from 'react';
import { PendingEvent, PendingEventResponse } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, Users, Clock, Check, Edit3, X, Loader2, AlignLeft } from '@/components/icons';

interface EventConfirmationCardProps {
    pendingEvent: PendingEventResponse;
    onAccept: () => Promise<void>;
    onModify: () => void;
    onReject: (reason?: string) => Promise<void>;
    isLoading?: boolean;
}

/**
 * Formate une date ISO en format lisible
 */
function formatDateTime(isoString: string): string {
    try {
        const date = new Date(isoString);
        return format(date, "EEEE d MMMM", { locale: fr });
    } catch {
        return isoString;
    }
}

/**
 * Formate l'heure
 */
function formatTime(isoString: string): string {
    try {
        const date = new Date(isoString);
        return format(date, "HH:mm", { locale: fr });
    } catch {
        return '';
    }
}

/**
 * Calcule la durée entre deux dates
 */
function getDuration(start: string, end: string): string {
    try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffMins = Math.round(diffMs / 60000);

        if (diffMins < 60) {
            return `${diffMins} min`;
        }
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
    } catch {
        return '';
    }
}

export function EventConfirmationCard({
    pendingEvent,
    onAccept,
    onModify,
    onReject,
    isLoading = false,
}: EventConfirmationCardProps) {
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const { event, actionType = 'create', count, eventIds } = pendingEvent;
    const isDelete = actionType === 'delete';
    const isBatchDelete = actionType === 'batch_delete';
    const isDeleteAction = isDelete || isBatchDelete;
    const duration = getDuration(event.startDateTime, event.endDateTime);
    const dateFormatted = formatDateTime(event.startDateTime);
    const timeStart = formatTime(event.startDateTime);
    const timeEnd = formatTime(event.endDateTime);

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            await onAccept();
        } finally {
            setIsAccepting(false);
        }
    };

    const handleReject = async () => {
        setIsRejecting(true);
        try {
            await onReject(rejectReason || undefined);
        } finally {
            setIsRejecting(false);
            setShowRejectInput(false);
            setRejectReason('');
        }
    };

    const isProcessing = isLoading || isAccepting || isRejecting;

    // 🆕 Couleurs selon le type d'action
    const accentColor = isDeleteAction ? 'notion-red' : 'notion-blue';
    const headerBg = isDeleteAction
        ? 'linear-gradient(135deg, rgba(224, 62, 62, 0.08), rgba(224, 62, 62, 0.02))'
        : 'linear-gradient(135deg, rgb(var(--accent-color-rgb) / 0.08), rgb(var(--accent-color-rgb) / 0.02))';
    const headerBorder = isDeleteAction
        ? '1px solid rgba(224, 62, 62, 0.1)'
        : '1px solid rgb(var(--accent-color-rgb) / 0.1)';
    const iconBg = isDeleteAction ? 'bg-notion-red/15' : 'bg-notion-blue/15';

    return (
        <div
            className="bg-notion-bg rounded-2xl shadow-lg border border-notion-border overflow-hidden transition-all duration-300"
            style={{ boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1)' }}
        >
            {/* Header avec couleur selon action */}
            <div
                className="px-6 py-4 flex items-center gap-4"
                style={{
                    background: headerBg,
                    borderBottom: headerBorder
                }}
            >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                    {isDeleteAction ? (
                        <X className={`w-6 h-6 text-${accentColor}`} />
                    ) : (
                        <Calendar className={`w-6 h-6 text-${accentColor}`} />
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-notion-text">
                        {isBatchDelete
                            ? `Supprimer ${count || eventIds?.length || 0} événement(s)`
                            : isDelete
                                ? 'Confirmer la suppression'
                                : 'Confirmation requise'}
                    </h3>
                    <p className="text-sm text-notion-textLight">
                        {isBatchDelete
                            ? 'Voulez-vous vraiment supprimer tous ces événements ?'
                            : isDelete
                                ? 'Voulez-vous vraiment supprimer cet événement ?'
                                : 'Vérifiez les détails avant de créer'}
                    </p>
                </div>
            </div>

            {/* Event Details */}
            <div className="px-6 py-5">
                {/* Title - show count for batch */}
                <h4 className="text-xl font-bold text-notion-text mb-4">
                    {isBatchDelete
                        ? `${count || eventIds?.length || 0} × "${event.title}"`
                        : event.title}
                </h4>

                {/* Info Grid */}
                <div className="space-y-3">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                        <div
                            className="p-2.5 rounded-lg shrink-0"
                            style={{ backgroundColor: 'rgb(var(--accent-color-rgb) / 0.1)' }}
                        >
                            <Clock className="w-4 h-4 text-notion-blue" />
                        </div>
                        <div className="flex-1 pt-1">
                            <div className="text-sm font-medium text-notion-text capitalize">{dateFormatted}</div>
                            <div className="text-sm text-notion-textLight flex items-center gap-2">
                                <span>{timeStart} → {timeEnd}</span>
                                {duration && (
                                    <span
                                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: 'rgb(var(--accent-color-rgb) / 0.1)',
                                            color: 'rgb(var(--accent-color-rgb))'
                                        }}
                                    >
                                        {duration}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    {event.location && (
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg shrink-0 bg-notion-orange/10">
                                <MapPin className="w-4 h-4 text-notion-orange" />
                            </div>
                            <div className="flex-1 pt-1">
                                <div className="text-sm text-notion-text">{event.location}</div>
                            </div>
                        </div>
                    )}

                    {/* Attendees */}
                    {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg shrink-0 bg-notion-purple/10">
                                <Users className="w-4 h-4 text-notion-purple" />
                            </div>
                            <div className="flex-1 pt-1">
                                <div className="text-sm text-notion-text">
                                    {event.attendees.length} participant{event.attendees.length > 1 ? 's' : ''}
                                </div>
                                <div className="text-xs text-notion-textLight mt-0.5">
                                    {event.attendees.join(', ')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg shrink-0 bg-notion-green/10">
                                <AlignLeft className="w-4 h-4 text-notion-green" />
                            </div>
                            <div className="flex-1 pt-1">
                                <p className="text-sm text-notion-textLight">{event.description}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject Reason Input */}
            {showRejectInput && (
                <div className="px-6 pb-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-notion-sidebar rounded-xl p-4">
                        <label className="block text-sm font-medium text-notion-text mb-2">
                            Pourquoi refusez-vous ? <span className="text-notion-textLight font-normal">(optionnel)</span>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Ex: Je préfère un autre créneau, à 16h par exemple..."
                            className="w-full px-4 py-3 bg-notion-bg border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-blue resize-none text-notion-text placeholder:text-notion-textLight"
                            rows={2}
                            disabled={isProcessing}
                        />
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleReject}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2.5 bg-notion-red text-white rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isRejecting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <X className="w-4 h-4" />
                                        Confirmer le refus
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowRejectInput(false)}
                                disabled={isProcessing}
                                className="px-4 py-2.5 bg-notion-bg border border-notion-border hover:bg-notion-hover text-notion-text rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {!showRejectInput && (
                <div className="px-6 py-4 border-t border-notion-border bg-notion-sidebar/30 flex gap-3">
                    {/* Accept */}
                    <button
                        onClick={handleAccept}
                        disabled={isProcessing}
                        className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 text-white rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${isDeleteAction ? 'bg-notion-red' : 'bg-notion-green'
                            }`}
                    >
                        {isAccepting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {isDeleteAction ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                                {isBatchDelete
                                    ? `Supprimer ${count || eventIds?.length || 0}`
                                    : isDelete
                                        ? 'Supprimer'
                                        : 'Créer'}
                            </>
                        )}
                    </button>

                    {/* Modify - Only show for create actions */}
                    {!isDeleteAction && (
                        <button
                            onClick={() => onModify()}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-notion-blue text-white rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Edit3 className="w-5 h-5" />
                            Modifier
                        </button>
                    )}

                    {/* Reject/Cancel */}
                    <button
                        onClick={() => setShowRejectInput(true)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-notion-bg border-2 border-notion-border text-notion-text rounded-xl font-semibold text-sm transition-all hover:border-notion-textLight hover:bg-notion-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X className="w-5 h-5" />
                        Annuler
                    </button>
                </div>
            )}
        </div>
    );
}
