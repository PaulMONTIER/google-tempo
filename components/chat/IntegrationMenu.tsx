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

/**
 * Menu d'intégrations (+) pour Gmail et Google Drive
 * Affiche les options d'import de contexte externe
 */
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
            description: 'Détecter les deadlines dans vos emails',
            color: 'from-red-500 to-pink-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            iconColor: 'text-red-600 dark:text-red-400',
        },
        {
            id: 'gdrive' as IntegrationType,
            name: 'Google Drive',
            icon: FolderOpen,
            description: 'Importer des documents pour la révision',
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
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
          p-3 rounded-lg transition-all duration-200
          ${isOpen
                        ? 'bg-notion-blue text-white rotate-45'
                        : 'bg-notion-sidebar text-notion-text hover:bg-notion-hover'
                    }
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          focus:outline-none focus:ring-2 focus:ring-notion-blue focus:ring-offset-2
        `}
                aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir les intégrations'}
            >
                {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : isOpen ? (
                    <X className="w-5 h-5" />
                ) : (
                    <Plus className="w-5 h-5" />
                )}
            </button>

            {/* Menu popup */}
            {isOpen && (
                <div
                    className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-800 
                     rounded-xl shadow-xl border border-notion-border overflow-hidden
                     animate-in slide-in-from-bottom-2 fade-in duration-200"
                >
                    <div className="p-3 border-b border-notion-border bg-notion-sidebar">
                        <p className="text-sm font-medium text-notion-text">Intégrations</p>
                        <p className="text-xs text-notion-textLight">Importez du contexte externe</p>
                    </div>

                    <div className="p-2 space-y-1">
                        {integrations.map((integration) => {
                            const Icon = integration.icon;
                            const isCurrentProcessing = processingType === integration.id;

                            return (
                                <button
                                    key={integration.id}
                                    onClick={() => handleSelect(integration.id)}
                                    disabled={isProcessing}
                                    className={`
                    w-full flex items-center gap-3 p-3 rounded-lg text-left
                    transition-all duration-200
                    ${isCurrentProcessing
                                            ? 'bg-notion-blue/10 border border-notion-blue'
                                            : 'hover:bg-notion-hover border border-transparent'
                                        }
                    ${isProcessing && !isCurrentProcessing ? 'opacity-50' : ''}
                  `}
                                >
                                    <div className={`p-2 rounded-lg ${integration.bgColor}`}>
                                        {isCurrentProcessing ? (
                                            <Loader2 className={`w-5 h-5 animate-spin ${integration.iconColor}`} />
                                        ) : (
                                            <Icon className={`w-5 h-5 ${integration.iconColor}`} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-notion-text">
                                            {integration.name}
                                        </p>
                                        <p className="text-xs text-notion-textLight truncate">
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
