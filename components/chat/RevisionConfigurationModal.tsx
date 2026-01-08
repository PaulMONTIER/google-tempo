'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Upload, HardDrive, Loader2, Sparkles, BookOpen, Clock, Check } from 'lucide-react';
import { DrivePickerModal } from '@/components/chat/DrivePickerModal';
import { DriveFileContent, DriveFile } from '@/types/integrations';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface RevisionConfigurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (config: RevisionConfiguration) => Promise<void>;
    eventTitle: string;
}

export interface RevisionConfiguration {
    documents: DriveFileContent[];
    sessionsCount: number;
    sessionDuration: number; // minutes
    includeQCM: boolean;
}

export function RevisionConfigurationModal({
    isOpen,
    onClose,
    onGenerate,
    eventTitle,
}: RevisionConfigurationModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<DriveFileContent[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Configuration State
    const [sessionsCount, setSessionsCount] = useState(5);
    const [sessionDuration, setSessionDuration] = useState(90);
    const [includeQCM, setIncludeQCM] = useState(false);

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

    const handleDriveSelect = async (files: DriveFile[]) => {
        setIsDrivePickerOpen(false);
        try {
            const response = await fetch('/api/gdrive/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileIds: files.map(f => f.id) }),
            });
            const data = await response.json();
            if (response.ok && data.files) {
                const processedFiles = data.files.map((f: DriveFileContent) => ({
                    ...f,
                    content: f.content?.substring(0, 5000) || ''
                }));
                setSelectedDocs((prev) => [...prev, ...processedFiles]);
            }
        } catch (error) {
            console.error('Error fetching Drive files:', error);
        }
    };

    const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const rawContent = e.target?.result as string;
                setSelectedDocs(prev => [...prev, {
                    id: `local-${Date.now()}-${Math.random()}`,
                    name: file.name,
                    mimeType: file.type,
                    content: rawContent?.substring(0, 5000) || '',
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
            await onGenerate({
                documents: selectedDocs,
                sessionsCount,
                sessionDuration,
                includeQCM
            });
            handleClose();
        } catch (error) {
            console.error('Error generating plan:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity`}
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
                    className={`w-full max-w-xl bg-notion-bg rounded-2xl shadow-2xl pointer-events-auto 
                        flex flex-col max-h-[85vh] transition-all ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                    style={{
                        transitionDuration: `${DURATIONS.animation}ms`,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-notion-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-notion-blue/15 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-notion-blue" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-notion-text">
                                    Programme de révision
                                </h2>
                                <p className="text-sm text-notion-textLight">
                                    {eventTitle}
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

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Documents Section */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-notion-textLight">
                                <BookOpen className="w-4 h-4" />
                                <span>Documents (optionnel)</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setIsDrivePickerOpen(true)}
                                    className="flex items-center gap-3 p-4 border border-notion-border rounded-xl 
                                        hover:border-notion-blue/50 hover:bg-notion-blue/5 transition-all group"
                                >
                                    <div className="w-9 h-9 bg-blue-500/15 rounded-lg flex items-center justify-center">
                                        <HardDrive className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-sm font-medium text-notion-text">Google Drive</span>
                                        <span className="text-xs text-notion-textLight">Importer</span>
                                    </div>
                                </button>

                                <label className="flex items-center gap-3 p-4 border border-notion-border rounded-xl 
                                    hover:border-notion-blue/50 hover:bg-notion-blue/5 transition-all group cursor-pointer">
                                    <div className="w-9 h-9 bg-notion-hover rounded-lg flex items-center justify-center">
                                        <Upload className="w-4 h-4 text-notion-textLight" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-sm font-medium text-notion-text">Fichier local</span>
                                        <span className="text-xs text-notion-textLight">PDF, TXT</span>
                                    </div>
                                    <input type="file" multiple className="hidden" onChange={handleLocalUpload} accept=".txt,.md,.json,.csv,.pdf" />
                                </label>
                            </div>

                            {selectedDocs.length > 0 && (
                                <div className="space-y-2 mt-3">
                                    {selectedDocs.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between px-3 py-2.5 bg-notion-sidebar rounded-lg">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <FileText className="w-4 h-4 text-notion-blue shrink-0" />
                                                <span className="text-sm text-notion-text truncate">{doc.name}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveDoc(doc.id)}
                                                className="p-1 hover:bg-notion-hover rounded transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5 text-notion-textLight" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <div className="h-px bg-notion-border" />

                        {/* Configuration Section */}
                        <section className="space-y-5">
                            {/* Sessions Count */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-notion-text">Nombre de sessions</span>
                                    <span className="text-sm font-semibold text-notion-blue">{sessionsCount}</span>
                                </div>
                                <div className="flex gap-2">
                                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => setSessionsCount(num)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${sessionsCount === num
                                                    ? 'bg-notion-blue text-white'
                                                    : 'bg-notion-sidebar text-notion-textLight hover:text-notion-text hover:bg-notion-hover'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-notion-text">
                                    <Clock className="w-4 h-4" />
                                    <span>Durée par session</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 60, label: '1h' },
                                        { value: 90, label: '1h30' },
                                        { value: 120, label: '2h' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setSessionDuration(opt.value)}
                                            className={`py-2.5 rounded-lg text-sm font-medium transition-all ${sessionDuration === opt.value
                                                    ? 'bg-notion-blue text-white'
                                                    : 'bg-notion-sidebar text-notion-textLight hover:text-notion-text hover:bg-notion-hover'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* QCM Toggle */}
                            <button
                                onClick={() => setIncludeQCM(!includeQCM)}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${includeQCM
                                        ? 'border-notion-blue bg-notion-blue/10'
                                        : 'border-notion-border hover:border-notion-blue/30'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${includeQCM
                                        ? 'bg-notion-blue border-notion-blue'
                                        : 'border-notion-border'
                                    }`}>
                                    {includeQCM && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="text-left flex-1">
                                    <span className="block text-sm font-medium text-notion-text">Inclure un QCM final</span>
                                    <span className="text-xs text-notion-textLight">Quiz de synthèse à la fin du programme</span>
                                </div>
                            </button>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-notion-border bg-notion-sidebar/30 flex justify-end gap-3 rounded-b-2xl">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-notion-textLight hover:text-notion-text transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-notion-blue text-white rounded-lg 
                                text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>

            {/* Drive Picker */}
            <DrivePickerModal
                isOpen={isDrivePickerOpen}
                onClose={() => setIsDrivePickerOpen(false)}
                onSelect={handleDriveSelect}
            />
        </>
    );
}
