'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserPreferencesData {
    priorityActivities: string[];
    studySubjects: string[];
    sportDiscipline: string | null;
    targetSoftSkills: string[];
    dailyNotificationTime: string;
    messageTone: string;
    sportIntegrations: string[];
}

export function useUserPreferences() {
    const [preferences, setPreferences] = useState<UserPreferencesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPreferences = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/onboarding/status');

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des préférences');
            }

            const data = await response.json();

            if (data.preferences) {
                setPreferences(data.preferences);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(message);
            console.error('Erreur useUserPreferences:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    return {
        preferences,
        isLoading,
        error,
        refetch: fetchPreferences,
    };
}
