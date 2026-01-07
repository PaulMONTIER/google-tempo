'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, File, Loader2, Search, Check, X, RefreshCw } from 'lucide-react';
import { DriveFile } from '@/types/integrations';
import { getFileIcon, formatFileSize } from '@/lib/utils/gdrive-helpers';

interface DriveFilePickerProps {
    onFilesSelected: (files: DriveFile[]) => void;
    onClose: () => void;
    maxFiles?: number;
}

/**
 * Composant de sélection de fichiers Google Drive
 * Version simplifiée sans le Picker officiel (pour éviter les dépendances complexes)
 */
export function DriveFilePicker({
    onFilesSelected,
    onClose,
    maxFiles = 5,
}: DriveFilePickerProps) {
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchFiles = useCallback(async (search?: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            params.set('limit', '30');

            const response = await fetch(`/api/gdrive/files?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors du chargement');
            }

            setFiles(data.files || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchQuery.length >= 2 || searchQuery.length === 0) {
                fetchFiles(searchQuery || undefined);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, fetchFiles]);

    const toggleFileSelection = (fileId: string) => {
        setSelectedFiles((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(fileId)) {
                newSet.delete(fileId);
            } else if (newSet.size < maxFiles) {
                newSet.add(fileId);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        const selected = files.filter((f) => selectedFiles.has(f.id));
        onFilesSelected(selected);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-notion-border bg-notion-sidebar flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-notion-text">Google Drive</h2>
                            <p className="text-xs text-notion-textLight">
                                Sélectionnez jusqu'à {maxFiles} fichiers
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-notion-hover rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-notion-textLight" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-notion-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-notion-textLight" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher des fichiers..."
                            className="w-full pl-10 pr-4 py-2 bg-notion-bg border border-notion-border rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-notion-blue text-sm"
                        />
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-notion-blue" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500 mb-4">{error}</p>
                            <button
                                onClick={() => fetchFiles()}
                                className="flex items-center gap-2 mx-auto px-4 py-2 bg-notion-sidebar rounded-lg hover:bg-notion-hover"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Réessayer
                            </button>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="text-center py-12 text-notion-textLight">
                            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun fichier trouvé</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {files.map((file) => {
                                const isSelected = selectedFiles.has(file.id);
                                const icon = getFileIcon(file.mimeType);

                                return (
                                    <button
                                        key={file.id}
                                        onClick={() => toggleFileSelection(file.id)}
                                        className={`
                      w-full flex items-center gap-3 p-3 rounded-lg text-left
                      transition-all duration-200
                      ${isSelected
                                                ? 'bg-notion-blue/10 border border-notion-blue'
                                                : 'hover:bg-notion-hover border border-transparent'
                                            }
                    `}
                                    >
                                        {/* Checkbox */}
                                        <div
                                            className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected
                                                    ? 'bg-notion-blue border-notion-blue'
                                                    : 'border-notion-border'
                                                }
                      `}
                                        >
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>

                                        {/* Icon */}
                                        <span className="text-xl">{icon}</span>

                                        {/* File info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-notion-text truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-notion-textLight">
                                                {formatDate(file.modifiedTime)}
                                                {file.size && ` · ${formatFileSize(file.size)}`}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-notion-border bg-notion-sidebar flex items-center justify-between">
                    <p className="text-sm text-notion-textLight">
                        {selectedFiles.size} fichier(s) sélectionné(s)
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-notion-text hover:bg-notion-hover rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedFiles.size === 0}
                            className="px-4 py-2 text-sm bg-notion-blue text-white rounded-lg hover:opacity-90 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
