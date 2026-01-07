'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Loader2, Search, Check, X, RefreshCw } from 'lucide-react';
import { DriveFile } from '@/types/integrations';
import { getFileIcon, formatFileSize } from '@/lib/utils/gdrive-helpers';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface DriveFilePickerProps {
    onFilesSelected: (files: DriveFile[]) => void;
    onClose: () => void;
    maxFiles?: number;
}

export function DriveFilePicker({
    onFilesSelected,
    onClose,
    maxFiles = 5,
}: DriveFilePickerProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, DURATIONS.animation);
    };

    const fetchFiles = useCallback(async (search?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            params.set('limit', '30');
            const response = await fetch(`/api/gdrive/files?${params.toString()}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erreur lors du chargement');
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
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                style={{
                    zIndex: Z_INDEX.modalOverlay,
                    transitionDuration: `${DURATIONS.animation}ms`,
                    opacity: isVisible ? 1 : 0
                }}
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
                style={{ zIndex: Z_INDEX.modal }}
            >
                <div
                    className={`bg-notion-bg rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] 
                        flex flex-col overflow-hidden pointer-events-auto 
                        transition-all ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    style={{
                        transitionDuration: `${DURATIONS.animation}ms`,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-notion-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center">
                                <FolderOpen className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-notion-text">
                                    Google Drive
                                </h2>
                                <p className="text-sm text-notion-textLight">
                                    Sélectionnez jusqu'à {maxFiles} fichiers
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-notion-hover rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-notion-textLight" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-6 py-3 border-b border-notion-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-notion-textLight" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher des fichiers..."
                                className="w-full pl-10 pr-4 py-2.5 bg-notion-sidebar border border-notion-border rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* File List */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-6 h-6 animate-spin text-notion-blue" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-16">
                                <p className="text-red-500 text-sm mb-4">{error}</p>
                                <button
                                    onClick={() => fetchFiles()}
                                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-notion-sidebar rounded-lg hover:bg-notion-hover text-sm"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Réessayer
                                </button>
                            </div>
                        ) : files.length === 0 ? (
                            <div className="text-center py-16 text-notion-textLight">
                                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p className="text-sm">Aucun fichier trouvé</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-notion-border/50">
                                {files.map((file) => {
                                    const isSelected = selectedFiles.has(file.id);
                                    const icon = getFileIcon(file.mimeType);

                                    return (
                                        <button
                                            key={file.id}
                                            onClick={() => toggleFileSelection(file.id)}
                                            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${isSelected ? 'bg-notion-blue/10' : 'hover:bg-notion-hover'
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                    ? 'bg-notion-blue border-notion-blue'
                                                    : 'border-notion-border'
                                                }`}>
                                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                            </div>

                                            {/* Icon */}
                                            <span className="text-lg shrink-0">{icon}</span>

                                            {/* File info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-notion-text truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-notion-textLight">
                                                    {formatDate(file.modifiedTime)}
                                                    {file.size && ` • ${formatFileSize(file.size)}`}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-notion-border bg-notion-sidebar/30 flex items-center justify-between">
                        <p className="text-sm text-notion-textLight">
                            {selectedFiles.size} fichier{selectedFiles.size > 1 ? 's' : ''} sélectionné{selectedFiles.size > 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium text-notion-textLight hover:text-notion-text transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={selectedFiles.size === 0}
                                className="px-5 py-2.5 text-sm font-medium bg-notion-blue text-white rounded-lg hover:opacity-90 
                                    disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
