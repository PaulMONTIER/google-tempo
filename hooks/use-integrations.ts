'use client';

import { useState, useCallback } from 'react';
import { IntegrationType } from '@/components/chat/IntegrationMenu';
import { DetectedDeadline, DriveFile, DriveFileContent, RevisionPlan } from '@/types/integrations';

interface IntegrationState {
    // Gmail
    isAnalyzingEmails: boolean;
    detectedDeadlines: DetectedDeadline[] | null;

    // GDrive
    isPickerOpen: boolean;
    selectedFiles: DriveFile[];
    fileContents: DriveFileContent[] | null;

    // Revision Planner
    isGeneratingPlan: boolean;
    revisionPlan: RevisionPlan | null;
    targetEvent: { title: string; date: string } | null;

    // General
    processingType: IntegrationType | null;
    error: string | null;
}

const initialState: IntegrationState = {
    isAnalyzingEmails: false,
    detectedDeadlines: null,
    isPickerOpen: false,
    selectedFiles: [],
    fileContents: null,
    isGeneratingPlan: false,
    revisionPlan: null,
    targetEvent: null,
    processingType: null,
    error: null,
};

export function useIntegrations() {
    const [state, setState] = useState<IntegrationState>(initialState);

    // Handle integration selection
    const handleIntegration = useCallback(async (type: IntegrationType) => {
        setState((prev) => ({ ...prev, processingType: type, error: null }));

        if (type === 'gmail') {
            await analyzeGmail();
        } else if (type === 'gdrive') {
            openDrivePicker();
        }
    }, []);

    // Gmail: Analyze emails
    const analyzeGmail = useCallback(async () => {
        setState((prev) => ({ ...prev, isAnalyzingEmails: true }));

        try {
            const response = await fetch('/api/gmail/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: 2 }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'analyse');
            }

            setState((prev) => ({
                ...prev,
                detectedDeadlines: data.deadlines,
                isAnalyzingEmails: false,
                processingType: null,
            }));
        } catch (error: any) {
            setState((prev) => ({
                ...prev,
                error: error.message,
                isAnalyzingEmails: false,
                processingType: null,
            }));
        }
    }, []);

    // GDrive: Open picker
    const openDrivePicker = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isPickerOpen: true,
            processingType: null,
        }));
    }, []);

    // GDrive: Handle file selection
    const handleFilesSelected = useCallback(async (files: DriveFile[]) => {
        setState((prev) => ({
            ...prev,
            selectedFiles: files,
            isPickerOpen: false,
        }));

        // Fetch file contents
        if (files.length > 0) {
            try {
                const response = await fetch('/api/gdrive/files', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileIds: files.map((f) => f.id) }),
                });

                const data = await response.json();

                if (response.ok) {
                    setState((prev) => ({
                        ...prev,
                        fileContents: data.files,
                    }));

                    // Trigger RAG Ingestion in the background
                    try {
                        fetch('/api/rag/ingest', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ files: data.files })
                        }).then(res => res.json())
                            .then(ingestData => console.log('[RAG] Background ingestion info:', ingestData))
                            .catch(err => console.error('[RAG] Background ingestion error:', err));
                    } catch (ingestError) {
                        console.error('[RAG] Failed to start background ingestion:', ingestError);
                    }
                }
            } catch (error) {
                console.error('Error fetching file contents:', error);
            }
        }
    }, []);

    // GDrive: Close picker
    const closeDrivePicker = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isPickerOpen: false,
            processingType: null,
        }));
    }, []);

    // Set target event for revision planning
    const setTargetEvent = useCallback((title: string, date: string) => {
        setState((prev) => ({
            ...prev,
            targetEvent: { title, date },
        }));
    }, []);

    // Generate revision plan
    const generateRevisionPlan = useCallback(async (overrides?: {
        eventTitle: string;
        eventDate: string;
        documents: DriveFileContent[];
        sessionsCount?: number;
        sessionDuration?: number;
        includeQCM?: boolean;
    }) => {
        const targetEvent = overrides ? { title: overrides.eventTitle, date: overrides.eventDate } : state.targetEvent;
        const fileContents = overrides ? overrides.documents : state.fileContents;

        if (!targetEvent) {
            console.error('No target event set');
            return;
        }

        setState((prev) => ({ ...prev, isGeneratingPlan: true, error: null }));

        try {
            const response = await fetch('/api/revision/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventTitle: targetEvent.title,
                    eventDate: targetEvent.date,
                    documents: fileContents || [],
                    sessionsCount: overrides?.sessionsCount,
                    sessionDuration: overrides?.sessionDuration,
                    includeQCM: overrides?.includeQCM,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la génération');
            }

            setState((prev) => ({
                ...prev,
                revisionPlan: data.plan,
                isGeneratingPlan: false,
            }));
        } catch (error: any) {
            setState((prev) => ({
                ...prev,
                error: error.message,
                isGeneratingPlan: false,
            }));
        }
    }, [state.targetEvent, state.fileContents]);

    // Clear deadlines
    const clearDeadlines = useCallback(() => {
        setState((prev) => ({
            ...prev,
            detectedDeadlines: null,
        }));
    }, []);

    // Clear revision plan
    const clearRevisionPlan = useCallback(() => {
        setState((prev) => ({
            ...prev,
            revisionPlan: null,
            targetEvent: null,
            fileContents: null,
            selectedFiles: [],
        }));
    }, []);

    // Reset all
    const reset = useCallback(() => {
        setState(initialState);
    }, []);

    // Clear error state
    const clearError = useCallback(() => {
        setState((prev) => ({ ...prev, error: null }));
    }, []);

    return {
        ...state,

        // Actions
        handleIntegration,
        analyzeGmail,
        openDrivePicker,
        closeDrivePicker,
        handleFilesSelected,
        setTargetEvent,
        generateRevisionPlan,
        clearDeadlines,
        clearRevisionPlan,
        clearError,
        reset,

        // Computed
        isProcessing: state.isAnalyzingEmails || state.isGeneratingPlan,
        hasDeadlines: (state.detectedDeadlines?.length ?? 0) > 0,
        hasSelectedFiles: state.selectedFiles.length > 0,
    };
}
