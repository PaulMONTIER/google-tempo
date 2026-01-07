'use client';

import { Sparkles, Rocket, ArrowRight } from 'lucide-react';

interface AnalysisEmptyProps {
    firstName: string;
    handleContinue: () => void;
    handleSkip: () => void;
    onSkip?: () => void;
}

export function AnalysisEmpty({ firstName, handleContinue, handleSkip, onSkip }: AnalysisEmptyProps) {
    return (
        <>
            <div className="flex justify-center mb-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-notion-blue to-blue-600 
                        flex items-center justify-center shadow-lg shadow-notion-blue/30
                        animate-float">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                </div>
            </div>

            <div className="text-center space-y-4 mb-8">
                <h1 className="text-3xl font-bold text-notion-text">
                    Bienvenue, {firstName} !
                </h1>
                <p className="text-lg text-notion-textLight leading-relaxed">
                    Prêt à <span className="text-notion-blue font-semibold">gamifier ton planning</span> ?
                </p>
                <p className="text-notion-textLight">
                    Ton calendrier est vide pour le moment - c&apos;est le moment idéal pour démarrer !
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-notion-sidebar rounded-xl">
                <div className="text-center">
                    <div className="text-2xl font-bold text-notion-blue">🎯</div>
                    <div className="text-xs text-notion-textLight mt-1">Objectifs</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-notion-blue">🏆</div>
                    <div className="text-xs text-notion-textLight mt-1">Badges</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-notion-blue">📈</div>
                    <div className="text-xs text-notion-textLight mt-1">Progression</div>
                </div>
            </div>

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
                <span>C&apos;est parti !</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {onSkip && (
                <button
                    onClick={handleSkip}
                    className="w-full mt-4 py-2 text-sm text-notion-textLight 
                   hover:text-notion-text transition-colors"
                >
                    Configurer plus tard
                </button>
            )}
        </>
    );
}
