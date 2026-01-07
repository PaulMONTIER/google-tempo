'use client';

import { CheckCircle2, Rocket, ArrowRight, Calendar, TrendingUp } from 'lucide-react';

interface AnalysisResultsProps {
    firstName: string;
    results: any;
    handleContinue: () => void;
    handleSkip: () => void;
    router: any;
}

export function AnalysisResults({ firstName, results, handleContinue, handleSkip, router }: AnalysisResultsProps) {
    return (
        <>
            <div className="flex justify-center mb-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 
                        flex items-center justify-center shadow-lg shadow-green-500/30
                        animate-float">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                </div>
            </div>

            <div className="text-center space-y-3 mb-6">
                <h1 className="text-3xl font-bold text-notion-text">
                    Bienvenue, {firstName} !
                </h1>
                <p className="text-lg text-green-600 font-semibold">
                    🎉 {results.totalPoints} points de départ !
                </p>
                <p className="text-notion-textLight">
                    On a analysé <span className="font-semibold text-notion-text">{results.totalEvents} événements</span> de ton calendrier
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-notion-sidebar rounded-xl">
                {Object.entries(results.byCategory).map(([category, data]: [string, any]) => (
                    data.count > 0 && (
                        <div key={category} className="text-center p-2">
                            <div className="text-lg font-bold text-notion-text">
                                {category === 'studies' && '📚'}
                                {category === 'sport' && '🏃'}
                                {category === 'pro' && '💼'}
                                {category === 'personal' && '🏠'}
                                {' '}{data.points} pts
                            </div>
                            <div className="text-xs text-notion-textLight">
                                {data.count} {category === 'studies' ? 'révisions' : category === 'sport' ? 'entraînements' : category === 'pro' ? 'réunions' : 'événements'}
                            </div>
                        </div>
                    )
                ))}
            </div>

            {results.trophyLevel && (
                <div className="flex items-center justify-center gap-3 mb-6 p-3 bg-notion-blue/10 rounded-xl">
                    <span className="text-2xl">🏆</span>
                    <div>
                        <p className="text-sm font-semibold text-notion-text">
                            Niveau {results.trophyLevel.level} - {results.trophyLevel.name}
                        </p>
                        <div className="w-32 h-1.5 bg-notion-sidebar rounded-full mt-1">
                            <div
                                className="h-full bg-notion-blue rounded-full"
                                style={{ width: `${results.trophyLevel.progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <p className="text-center text-notion-textLight mb-4">
                Que veux-tu faire maintenant ?
            </p>

            <div className="space-y-3">
                <button
                    onClick={handleContinue}
                    className="group w-full flex items-center justify-center gap-3 
                   px-6 py-4 rounded-xl font-semibold
                   bg-gradient-to-r from-notion-blue to-blue-600 text-white
                   hover:from-notion-blue/90 hover:to-blue-600/90
                   shadow-lg shadow-notion-blue/25 hover:shadow-xl
                   transition-all duration-300"
                >
                    <Rocket className="w-5 h-5" />
                    <span>Configurer mon profil</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                    onClick={() => {
                        handleSkip();
                        router.push('/');
                    }}
                    className="group w-full flex items-center justify-center gap-3 
                   px-6 py-3 rounded-xl font-medium
                   bg-notion-sidebar text-notion-text border border-notion-border
                   hover:bg-notion-hover hover:border-notion-blue/50
                   transition-all duration-300"
                >
                    <Calendar className="w-5 h-5 text-notion-textLight group-hover:text-notion-blue" />
                    <span>Aller sur Tempo</span>
                </button>

                <button
                    onClick={() => {
                        handleSkip();
                        router.push('/progression');
                    }}
                    className="w-full py-2 text-sm text-notion-textLight 
                   hover:text-notion-blue transition-colors flex items-center justify-center gap-2"
                >
                    <TrendingUp className="w-4 h-4" />
                    <span>Voir ma progression détaillée</span>
                </button>
            </div>
        </>
    );
}
