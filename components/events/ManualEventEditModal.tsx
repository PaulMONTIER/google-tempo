'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent, PendingEvent } from '@/types';
import { Calendar, Clock, MapPin, AlignLeft, X, Check, Loader2, Trash } from '@/components/ui/icons';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface ManualEventEditModalProps {
    event: CalendarEvent;
    onClose: () => void;
    onSaveSuccess: () => void; // Pour rafraîchir la liste
}

export function ManualEventEditModal({
    event,
    onClose,
    onSaveSuccess
}: ManualEventEditModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // État du formulaire
    const [title, setTitle] = useState(event.title);
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState(event.location || '');
    const [description, setDescription] = useState(event.description || '');

    // Initialiser les dates/heures
    useEffect(() => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);

        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toTimeString().slice(0, 5));

        requestAnimationFrame(() => setIsVisible(true));
    }, [event]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, DURATIONS.animation);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
            const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

            const updates = {
                summary: title,
                start: { dateTime: startDateTime },
                end: { dateTime: endDateTime },
                location: location || undefined,
                description: description || undefined,
            };

            const res = await fetch(`/api/calendar/events/${event.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!res.ok) throw new Error('Erreur lors de la mise à jour');

            onSaveSuccess();
            handleClose();
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/calendar/events/${event.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Erreur lors de la suppression');

            onSaveSuccess();
            handleClose();
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la suppression');
        } finally {
            setIsDeleting(false);
        }
    };

    const isProcessing = isSaving || isDeleting;

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center p-4 transition-all`}
            style={{
                zIndex: Z_INDEX.modal,
                transitionDuration: `${DURATIONS.animation}ms`,
                opacity: isVisible ? 1 : 0
            }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div
                className={`bg-notion-bg rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative transition-all ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
                style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-notion-border">
                    <h2 className="text-lg font-semibold text-notion-text">Modifier l'événement</h2>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-notion-hover">
                        <X className="w-5 h-5 text-notion-textLight" />
                    </button>
                </div>

                {/* Form */}
                <div className="px-6 py-5 space-y-4 flex-1 overflow-y-auto max-h-[70vh]">
                    <div>
                        <label className="block text-sm font-medium text-notion-text mb-2">Titre</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-notion-bg border border-notion-border rounded-lg text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-notion-text mb-2">Début</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2 bg-notion-bg border border-notion-border rounded-lg"
                            />
                        </div>
                        <div className="pt-7">
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-4 py-2 bg-notion-bg border border-notion-border rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-notion-text mb-2">Fin</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2 bg-notion-bg border border-notion-border rounded-lg"
                            />
                        </div>
                        <div className="pt-7">
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-4 py-2 bg-notion-bg border border-notion-border rounded-lg"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-notion-text mb-2">Lieu</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-4 py-2 bg-notion-bg border border-notion-border rounded-lg"
                            placeholder="Optionnel"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-notion-text mb-2">Note / Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 bg-notion-bg border border-notion-border rounded-lg resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-notion-border bg-notion-sidebar/30 flex justify-between gap-3">
                    <button
                        onClick={handleDelete}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
                        Supprimer
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-notion-bg border border-notion-border rounded-lg hover:bg-notion-hover"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isProcessing || !title.trim()}
                            className="px-4 py-2 bg-notion-blue text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
