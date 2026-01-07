'use client';

import { useState, useEffect } from 'react';
import { PendingEvent, PendingEventResponse } from '@/types';
import { Calendar, Clock, MapPin, AlignLeft, X, Check, Loader2 } from '@/components/ui/icons';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface EventEditModalProps {
    pendingEvent: PendingEventResponse;
    onSave: (modifiedEvent: Partial<PendingEvent>) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

/**
 * Modal pour modifier un événement avant confirmation
 */
export function EventEditModal({
    pendingEvent,
    onSave,
    onCancel,
    isLoading = false,
}: EventEditModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // État du formulaire
    const [title, setTitle] = useState(pendingEvent.event.title);
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState(pendingEvent.event.location || '');
    const [description, setDescription] = useState(pendingEvent.event.description || '');

    // Initialiser les dates/heures
    useEffect(() => {
        const start = new Date(pendingEvent.event.startDateTime);
        const end = new Date(pendingEvent.event.endDateTime);

        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toTimeString().slice(0, 5));

        // Animation d'entrée
        requestAnimationFrame(() => setIsVisible(true));
    }, [pendingEvent]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onCancel, DURATIONS.animation);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Construire les nouvelles dates ISO
            const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
            const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

            const modifiedEvent: Partial<PendingEvent> = {
                title,
                startDateTime,
                endDateTime,
                location: location || undefined,
                description: description || undefined,
            };

            onSave(modifiedEvent);
        } finally {
            setIsSaving(false);
        }
    };

    const isProcessing = isLoading || isSaving;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity`}
                style={{
                    zIndex: Z_INDEX.modalOverlay,
                    transitionDuration: `${DURATIONS.animation}ms`,
                    opacity: isVisible ? 1 : 0
                }}
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className={`fixed inset-0 flex items-center justify-center p-4 transition-all`}
                style={{
                    zIndex: Z_INDEX.modal,
                    transitionDuration: `${DURATIONS.animation}ms`,
                    opacity: isVisible ? 1 : 0
                }}
            >
                <div
                    className={`bg-notion-bg rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transition-all ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                        }`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        transitionDuration: `${DURATIONS.animation}ms`,
                    }}
                >
                    {/* Header */}
                    <div
                        className="px-6 py-4 flex items-center justify-between"
                        style={{
                            background: 'linear-gradient(135deg, rgb(var(--accent-color-rgb) / 0.08), rgb(var(--accent-color-rgb) / 0.02))',
                            borderBottom: '1px solid rgb(var(--accent-color-rgb) / 0.1)'
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: 'rgb(var(--accent-color-rgb) / 0.15)' }}
                            >
                                <Calendar className="w-5 h-5 text-notion-blue" />
                            </div>
                            <h2 className="text-lg font-semibold text-notion-text">Modifier l'événement</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-notion-hover transition-colors"
                        >
                            <X className="w-5 h-5 text-notion-textLight" />
                        </button>
                    </div>

                    {/* Form */}
                    <div className="px-6 py-5 space-y-4">
                        {/* Titre */}
                        <div>
                            <label className="block text-sm font-medium text-notion-text mb-2">
                                Titre
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 bg-notion-bg border border-notion-border rounded-lg text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
                                placeholder="Nom de l'événement"
                            />
                        </div>

                        {/* Date et heure de début */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-notion-text mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-notion-blue" />
                                    Date de début
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-notion-bg border border-notion-border rounded-lg text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-notion-text mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-notion-blue" />
                                    Heure
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-notion-bg border border-notion-border rounded-lg text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Date et heure de fin */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-notion-text mb-2">
                                    Date de fin
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-notion-bg border border-notion-border rounded-lg text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-notion-text mb-2">
                                    Heure
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-notion-bg border border-notion-border rounded-lg text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Lieu */}
                        <div>
                            <label className="block text-sm font-medium text-notion-text mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-notion-orange" />
                                Lieu (optionnel)
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full px-4 py-2.5 bg-notion-bg border border-notion-border rounded-lg text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
                                placeholder="Adresse ou lieu"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-notion-text mb-2 flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-notion-green" />
                                Description (optionnel)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2.5 bg-notion-bg border border-notion-border rounded-lg text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent resize-none"
                                rows={3}
                                placeholder="Notes ou détails..."
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-notion-border bg-notion-sidebar/30 flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={isProcessing}
                            className="flex-1 px-5 py-3 bg-notion-bg border-2 border-notion-border hover:bg-notion-hover text-notion-text rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isProcessing || !title.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-notion-green text-white rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isSaving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Sauvegarder et créer
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
