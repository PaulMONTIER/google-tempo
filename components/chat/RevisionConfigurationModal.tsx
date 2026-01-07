'use client';

import { useState } from 'react';
import { X, FileText, Upload, HardDrive, Loader2, Sparkles, Settings, BookOpen, Clock, HelpCircle } from 'lucide-react';
import { DrivePickerModal } from '@/components/chat/DrivePickerModal';
import { DriveFileContent, DriveFile } from '@/types/integrations';

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
    const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<DriveFileContent[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Configuration State
    const [sessionsCount, setSessionsCount] = useState(5);
    const [sessionDuration, setSessionDuration] = useState(90); // 1h30
    const [includeQCM, setIncludeQCM] = useState(false);

    if (!isOpen) return null;



    const handleDriveSelect = async (files: DriveFile[]) => {
        setIsDrivePickerOpen(false);

        // Fetch content for selected files
        try {
            const response = await fetch('/api/gdrive/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileIds: files.map(f => f.id) }),
            });

            const data = await response.json();

            if (response.ok && data.files) {
                // Truncate content client-side to avoid payload limits
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
                // Truncate content client-side to avoid payload limits
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
            await onGenerate({
                documents: selectedDocs,
                sessionsCount,
                sessionDuration,
                includeQCM
            });
            onClose();
        } catch (error) {
            console.error('Error generating plan:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1A1A1A] w-full max-w-2xl rounded-xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            Configurer le programme
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Pour : <span className="font-medium text-gray-200">{eventTitle}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* 1. Documents */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            1. Documents & Ressources
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <button
                                onClick={() => setIsDrivePickerOpen(true)}
                                className="flex items-center gap-3 p-4 border border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group text-left bg-black/20"
                            >
                                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <HardDrive className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block font-medium text-gray-200">Google Drive</span>
                                    <span className="text-xs text-gray-500">Importer des fichiers</span>
                                </div>
                            </button>

                            <label className="flex items-center gap-3 p-4 border border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group cursor-pointer text-left bg-black/20">
                                <div className="w-10 h-10 bg-white/10 text-gray-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block font-medium text-gray-200">Fichiers locaux</span>
                                    <span className="text-xs text-gray-500">PDF, TXT, MD</span>
                                </div>
                                <input type="file" multiple className="hidden" onChange={handleLocalUpload} accept=".txt,.md,.json,.csv" />
                            </label>
                        </div>

                        {selectedDocs.length > 0 && (
                            <div className="space-y-2">
                                {selectedDocs.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 text-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                            <span className="truncate text-gray-300">{doc.name}</span>
                                        </div>
                                        <button onClick={() => handleRemoveDoc(doc.id)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="h-px bg-white/10" />

                    {/* 2. Configuration */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            2. Paramètres
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Nombre de sessions */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300">
                                    Nombre de sessions : <span className="text-indigo-400 font-bold">{sessionsCount}</span>
                                </label>
                                <input
                                    type="range"
                                    min="2"
                                    max="10"
                                    step="1"
                                    value={sessionsCount}
                                    onChange={(e) => setSessionsCount(parseInt(e.target.value))}
                                    className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>2</span>
                                    <span>10</span>
                                </div>
                            </div>

                            {/* Durée par session */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Durée par session
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[60, 90, 120].map((duration) => (
                                        <button
                                            key={duration}
                                            onClick={() => setSessionDuration(duration)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${sessionDuration === duration
                                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                : 'bg-black/20 text-gray-400 border-white/10 hover:border-white/20 hover:text-gray-200'
                                                }`}
                                        >
                                            {duration} min
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Option QCM */}
                        <div className="mt-6">
                            <label className="flex items-center gap-3 p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors bg-black/20">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${includeQCM ? 'bg-indigo-600 border-indigo-600' : 'border-gray-600 bg-transparent'}`}>
                                    {includeQCM && <CheckIcon className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={includeQCM}
                                    onChange={(e) => setIncludeQCM(e.target.checked)}
                                    className="hidden"
                                />
                                <div className="flex-1">
                                    <span className="block font-medium text-gray-200 flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4 text-indigo-400" />
                                        Inclure un QCM final
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        La dernière session sera consacrée à une synthèse et un quiz.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

function CheckIcon(props: any) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    );
}
