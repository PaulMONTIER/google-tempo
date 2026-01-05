'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Trophy, TrendingUp, Award } from '@/components/icons';
import { ArenaTab, SkillsTab, StatsTab } from './tabs';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface ProgressionPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

type ProgressionTab = 'arena' | 'skills' | 'stats';

/**
 * Panel flottant de progression - style identique à SettingsPanel
 */
export function ProgressionPanel({ isOpen, onClose }: ProgressionPanelProps) {
    const [activeTab, setActiveTab] = useState<ProgressionTab>('arena');
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
        { id: 'arena' as ProgressionTab, label: 'Arène', icon: Trophy },
        { id: 'skills' as ProgressionTab, label: 'Compétences', icon: TrendingUp },
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
                    className={`w-full max-w-3xl max-h-[85vh] bg-notion-bg rounded-xl shadow-2xl pointer-events-auto transition-all ease-out flex flex-col ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                    style={{ transitionDuration: `${DURATIONS.animation}ms` }}
                >
                    {/* Header */}
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

                    <div className="flex flex-1 min-h-0">
                        {/* Sidebar */}
                        <div className="w-48 border-r border-notion-border bg-notion-sidebar/30 p-3 flex-shrink-0">
                            <nav className="space-y-1">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                                ? 'bg-notion-bg text-notion-text shadow-sm'
                                                : 'text-notion-textLight hover:bg-white/50 hover:text-notion-text'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'arena' && <ArenaTab />}
                            {activeTab === 'skills' && <SkillsTab />}
                            {activeTab === 'stats' && <StatsTab />}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
