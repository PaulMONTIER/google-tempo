'use client';

import { useState } from 'react';
import { X, FileText, Upload, HardDrive, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { DrivePickerModal } from '@/components/chat/DrivePickerModal';
import { DriveFileContent } from '@/types/integrations';

interface DocumentIngestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (documents: DriveFileContent[]) => Promise<void>;
    eventTitle: string;
}

export function DocumentIngestionModal({
    isOpen,
    onClose,
    onGenerate,
    eventTitle,
}: DocumentIngestionModalProps) {
    const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<DriveFileContent[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleDriveSelect = (files: any[]) => {
        // Map DriveFile to DriveFileContent
        const filesWithContent: DriveFileContent[] = files.map(f => ({ ...f, content: '' }));
        setSelectedDocs((prev) => [...prev, ...filesWithContent]);
        setIsDrivePickerOpen(false);
    };

    const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Simulation de lecture de fichier local (MVP: on prend juste le nom et un contenu placeholder)
        // Dans une version réelle, il faudrait lire le contenu (PDF.js, etc.)
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const rawContent = e.target?.result as string;
                // Truncate content client-side to avoid payload limits (Next.js API limit)
                // The AI service truncates to 1000 chars anyway.
                const truncatedContent = rawContent?.substring(0, 5000) || '';

                setSelectedDocs(prev => [...prev, {
                    id: `local-${Date.now()}-${Math.random()}`,
                    name: file.name,
                    mimeType: file.type,
                    content: truncatedContent,
                    webViewLink: '#'
                }]);
            };
            reader.readAsText(file);
        });
    };

    const handleRemoveDoc = (id: string) => {
        setSelectedDocs(prev => prev.filter(doc => doc.id !== id));
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await onGenerate(selectedDocs);
            onClose();
        } catch (error) {
            console.error('Error generating plan:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-notion-bg w-full max-w-2xl rounded-xl shadow-2xl border border-notion-border flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-notion-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-notion-text">Préparer la révision</h2>
                        <p className="text-sm text-notion-textLight mt-1">
                            Pour : <span className="font-medium text-notion-blue">{eventTitle}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-notion-hover rounded-lg transition-colors">
                        <X className="w-5 h-5 text-notion-textLight" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Sources Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Drive Button */}
                        <button
                            onClick={() => setIsDrivePickerOpen(true)}
                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-notion-border rounded-xl hover:border-notion-blue hover:bg-notion-blueLight transition-all group"
                        >
                            <div className="w-12 h-12 bg-notion-blueLight text-notion-blue rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <HardDrive className="w-6 h-6" />
                            </div>
                            <span className="font-medium text-notion-text">Google Drive</span>
                            <span className="text-xs text-notion-textLight mt-1">Sélectionner des fichiers</span>
                        </button>

                        {/* Local Upload Button */}
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-notion-border rounded-xl hover:border-notion-blue hover:bg-notion-blueLight transition-all group cursor-pointer">
                            <div className="w-12 h-12 bg-notion-hover text-notion-textLight rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <span className="font-medium text-notion-text">Fichiers locaux</span>
                            <span className="text-xs text-notion-textLight mt-1">PDF, TXT, MD (Max 10MB)</span>
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleLocalUpload}
                                accept=".txt,.md,.json,.csv" // MVP: texte seulement pour l'instant
                            />
                        </label>
                    </div>

                    {/* Selected Files List */}
                    {selectedDocs.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-notion-textLight uppercase tracking-wider">
                                Documents sélectionnés ({selectedDocs.length})
                            </h3>
                            <div className="space-y-2">
                                {selectedDocs.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 bg-notion-hover rounded-lg border border-notion-border">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-notion-bg rounded-lg border border-notion-border">
                                                <FileText className="w-4 h-4 text-notion-blue" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-notion-text truncate">{doc.name}</p>
                                                <p className="text-xs text-notion-textLight truncate">{doc.mimeType}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveDoc(doc.id)}
                                            className="p-1.5 hover:bg-notion-redLight hover:text-notion-red rounded-md transition-colors text-notion-textLight"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-notion-border bg-notion-bg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-notion-textLight hover:text-notion-text font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-6 py-2 bg-notion-blue text-white rounded-lg font-medium hover:bg-notion-blue/90 transition-colors shadow-lg shadow-notion-blue/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Génération...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Générer le programme
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Drive Picker Overlay */}
            <DrivePickerModal
                isOpen={isDrivePickerOpen}
                onClose={() => setIsDrivePickerOpen(false)}
                onSelect={handleDriveSelect}
            />
        </div>
    );
}
