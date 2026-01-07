'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Trophy, TrendingUp, Award, Target } from '@/components/ui/icons';
import { ArenaTab, SkillsTab, StatsTab, QuestsTab } from './tabs';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface ProgressionPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

type ProgressionTab = 'quests' | 'skills' | 'stats' | 'trophies';

/**
 * Panel flottant de progression - Style unifié avec SettingsPanel
 */
export function ProgressionPanel({ isOpen, onClose }: ProgressionPanelProps) {
    const [activeTab, setActiveTab] = useState<ProgressionTab>('skills');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, DURATIONS.animation);
    };

    const tabs = [
        { id: 'skills' as ProgressionTab, label: 'Compétences', icon: TrendingUp },
        { id: 'quests' as ProgressionTab, label: 'Quêtes', icon: Target },
        { id: 'trophies' as ProgressionTab, label: 'Trophées', icon: Trophy },
        { id: 'stats' as ProgressionTab, label: 'Statistiques', icon: Award },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                style={{
                    zIndex: Z_INDEX.modalOverlay,
                    transitionDuration: `${DURATIONS.animation}ms`,
                    opacity: isVisible ? 1 : 0,
                }}
                onClick={handleClose}
            />

            {/* Centered Modal */}
            <div
                className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
                style={{ zIndex: Z_INDEX.modal }}
            >
                <div
                    className="bg-notion-bg border border-notion-border shadow-2xl w-full max-w-4xl h-[85vh] rounded-xl flex flex-col overflow-hidden pointer-events-auto transition-all ease-out"
                    style={{
                        transitionDuration: `${DURATIONS.animation}ms`,
                        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
                        opacity: isVisible ? 1 : 0,
                    }}
                >
                    {/* Header (Identique à SettingsPanel) */}
                    <div className="bg-notion-bg border-b border-notion-border px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-semibold text-notion-text">Ma Progression</h2>
                            <p className="text-sm text-notion-textLight mt-0.5">
                                Suivez votre évolution et vos accomplissements
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-notion-hover rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-notion-textLight" />
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex flex-1 min-h-0">
                        {/* Sidebar */}
                        <div className="w-48 border-r border-notion-border bg-notion-sidebar/30 p-3 flex-shrink-0">
                            <nav className="space-y-1">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                                    ? 'bg-notion-bg text-notion-text shadow-sm'
                                                    : 'text-notion-textLight hover:bg-white/50 hover:text-notion-text'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-notion-text' : 'text-notion-textLight'}`} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-notion-bg">
                            <div className="max-w-3xl mx-auto h-full">
                                {activeTab === 'skills' && <SkillsTab />}
                                {activeTab === 'quests' && <QuestsTab />}
                                {activeTab === 'trophies' && <ArenaTab />}
                                {activeTab === 'stats' && <StatsTab />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
