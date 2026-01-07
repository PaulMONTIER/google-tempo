'use client';

import { Calendar, Loader2 } from 'lucide-react';

interface AnalysisLoadingProps {
    firstName: string;
    message: string;
    progress: number;
    phase: string;
}

export function AnalysisLoading({ firstName, message, progress, phase }: AnalysisLoadingProps) {
    return (
        <>
            <div className="flex justify-center mb-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-notion-blue to-blue-600 
                        flex items-center justify-center shadow-lg shadow-notion-blue/30
                        animate-pulse">
                        <Calendar className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-notion-bg rounded-full 
                        flex items-center justify-center border-2 border-notion-border">
                        <Loader2 className="w-4 h-4 text-notion-blue animate-spin" />
                    </div>
                </div>
            </div>

            <div className="text-center space-y-4 mb-6">
                <h1 className="text-2xl font-bold text-notion-text">
                    Bienvenue, {firstName} !
                </h1>
                <p className="text-notion-textLight">
                    {message || 'Analyse de ton calendrier en cours...'}
                </p>
            </div>

            <div className="mb-6">
                <div className="h-2 bg-notion-sidebar rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-notion-blue to-blue-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-notion-textLight mt-2 text-center">
                    {Math.round(progress)}% - {phase === 'fetching' && 'Récupération des événements'}
                    {phase === 'classifying' && 'Classification IA'}
                    {phase === 'calculating' && 'Calcul des points'}
                    {phase === 'saving' && 'Finalisation'}
                </p>
            </div>

            <p className="text-sm text-center text-notion-textLight">
                On analyse tes 3 derniers mois pour te donner des points de départ 🎯
            </p>
        </>
    );
}
