'use client';

import { useState } from 'react';
import { Plus, X, Mail, FolderOpen, Loader2 } from 'lucide-react';

export type IntegrationType = 'gmail' | 'gdrive';

interface IntegrationMenuProps {
    onSelectIntegration: (type: IntegrationType) => void;
    isProcessing?: boolean;
    processingType?: IntegrationType | null;
    disabled?: boolean;
}

export function IntegrationMenu({
    onSelectIntegration,
    isProcessing = false,
    processingType = null,
    disabled = false,
}: IntegrationMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (type: IntegrationType) => {
        onSelectIntegration(type);
        setIsOpen(false);
    };

    const integrations = [
        {
            id: 'gmail' as IntegrationType,
            name: 'Gmail',
            icon: Mail,
            description: 'Détecter les deadlines',
            iconBg: 'bg-red-500/15',
            iconColor: 'text-red-500',
        },
        {
            id: 'gdrive' as IntegrationType,
            name: 'Google Drive',
            icon: FolderOpen,
            description: 'Importer des documents',
            iconBg: 'bg-blue-500/15',
            iconColor: 'text-blue-500',
        },
    ];

    return (
        <div className="relative">
            {/* Bouton + */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled || isProcessing}
                className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    transition-all duration-200
                    ${isOpen
                        ? 'bg-notion-blue text-white'
                        : 'bg-notion-sidebar border border-notion-border text-notion-text hover:bg-notion-hover'
                    }
                    ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                    focus:outline-none focus:ring-2 focus:ring-notion-blue/50
                `}
                aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir les intégrations'}
            >
                {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Plus className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
                )}
            </button>

            {/* Menu popup */}
            {isOpen && (
                <div
                    className={`absolute bottom-full left-0 mb-2 w-64 bg-notion-bg rounded-xl shadow-xl 
                        border border-notion-border overflow-hidden
                        transition-all duration-200 origin-bottom-left
                        ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    style={{ boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)' }}
                >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-notion-border">
                        <p className="text-sm font-medium text-notion-text">Intégrations</p>
                        <p className="text-xs text-notion-textLight">Importer du contexte</p>
                    </div>

                    {/* Options */}
                    <div className="p-2">
                        {integrations.map((integration) => {
                            const Icon = integration.icon;
                            const isCurrentProcessing = processingType === integration.id;

                            return (
                                <button
                                    key={integration.id}
                                    onClick={() => handleSelect(integration.id)}
                                    disabled={isProcessing}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${isCurrentProcessing
                                            ? 'bg-notion-blue/10'
                                            : 'hover:bg-notion-hover'
                                        } ${isProcessing && !isCurrentProcessing ? 'opacity-50' : ''}`}
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${integration.iconBg}`}>
                                        {isCurrentProcessing ? (
                                            <Loader2 className={`w-4 h-4 animate-spin ${integration.iconColor}`} />
                                        ) : (
                                            <Icon className={`w-4 h-4 ${integration.iconColor}`} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-notion-text">
                                            {integration.name}
                                        </p>
                                        <p className="text-xs text-notion-textLight">
                                            {isCurrentProcessing ? 'Analyse en cours...' : integration.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Overlay pour fermer le menu */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}
