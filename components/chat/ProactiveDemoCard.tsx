import React from 'react';
import { Sparkles, Trophy, Activity, AlertCircle, CheckCircle } from '@/components/ui/icons';

export function ProactiveDemoCard() {
    return (
        <div className="flex flex-col space-y-4 w-full bg-notion-sidebar/30 rounded-xl p-5 border border-notion-border animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-notion-blue/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-notion-blue" />
                </div>
                <div>
                    <h3 className="font-semibold text-notion-text text-sm">Bonjour Paul, voici ton analyse matinale</h3>
                    <p className="text-xs text-notion-textLight">Généré proactivement à 08h00</p>
                </div>
            </div>

            <div className="text-sm text-notion-text leading-relaxed whitespace-pre-wrap">
                J'ai analysé ton planning de la semaine et tes avancées académiques. Voici un récapitulatif pour t'aider à optimiser ton temps et tes objectifs.
            </div>

            {/* Burnout Dashboard */}
            <div className="bg-notion-bg border border-notion-border rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2 text-notion-text font-medium text-sm">
                    <Activity className="w-4 h-4 text-orange-500" />
                    Analyse de Charge & Risque de Burnout
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-notion-textLight">Charge Hebdomadaire</span>
                    <span className="font-medium text-notion-text">82% (Élevée)</span>
                </div>

                <div className="w-full bg-notion-border h-1.5 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: '82%' }} />
                </div>

                <div className="flex items-start gap-2 text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400 p-2 rounded">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                        Attention : avec le Hackathon IA et tes révisions AWS qui s'enchaînent cette semaine, ton temps de repos est sous la moyenne conseillée. J'ai bloqué 2h de "Deep Work / Repos" jeudi matin pour sécuriser ta santé mentale.
                    </p>
                </div>
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">

                {/* Certification Data Camp */}
                <div className="bg-notion-bg border border-notion-border rounded-lg p-3 flex flex-col justify-between hover:bg-notion-hover transition-colors cursor-pointer group">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <h4 className="font-medium text-notion-text text-xs uppercase tracking-wider">Formation Conseillée</h4>
                        </div>
                        <p className="text-sm font-medium text-notion-text leading-tight group-hover:text-notion-blue transition-colors">
                            DataCamp : Machine Learning Scientist with Python
                        </p>
                        <p className="text-xs text-notion-textLight leading-snug">
                            En lien direct avec ton module "Data Science". Cette certification boostera considérablement ton employabilité en fin d'études.
                        </p>
                    </div>
                    <button className="text-xs font-medium text-notion-blue mt-3 flex items-center gap-1">
                        Ajouter l'objectif
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">→</span>
                    </button>
                </div>

                {/* Marathon Paris */}
                <div className="bg-notion-bg border border-notion-border rounded-lg p-3 flex flex-col justify-between hover:bg-notion-hover transition-colors cursor-pointer group">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <h4 className="font-medium text-notion-text text-xs uppercase tracking-wider">Défi Extra-scolaire</h4>
                        </div>
                        <p className="text-sm font-medium text-notion-text leading-tight group-hover:text-yellow-600 transition-colors">
                            Inscription - Schneider Electric Marathon de Paris
                        </p>
                        <p className="text-xs text-notion-textLight leading-snug">
                            Ton niveau en "Course à pied" a dépassé les 70 ! Les inscriptions (B2B/Devis Écoles) sont ouvertes. C'est un test parfait pour ta résilience.
                        </p>
                    </div>
                    <button className="text-xs font-medium text-yellow-600 mt-3 flex items-center gap-1">
                        Voir le programme
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">→</span>
                    </button>
                </div>

            </div>

        </div>
    );
}
