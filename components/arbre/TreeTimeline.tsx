import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Calendar, MoreHorizontal, Edit3, Trash, Loader2 } from '@/components/ui/icons';
import { BranchData } from '@/lib/services/tree-service';
import { formatDateShort } from '@/lib/utils/date-formatters';
import { useNotifications } from '@/components/notifications/NotificationSystem';

interface TreeTimelineProps {
    treeId: string;
    branches: BranchData[];
    goalTitle: string;
    isGoalPast: boolean;
    onUpdate?: () => void;
}

/**
 * Timeline horizontale pour afficher les branches d'un arbre
 */
export function TreeTimeline({ treeId, branches, goalTitle, isGoalPast, onUpdate }: TreeTimelineProps) {
    const { addNotification } = useNotifications();
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const menusRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const inputRef = useRef<HTMLInputElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (openMenuId && menusRef.current[openMenuId]) {
                if (!menusRef.current[openMenuId]?.contains(event.target as Node)) {
                    setOpenMenuId(null);
                }
            }
        }
        if (openMenuId) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    // Focus input when editing starts
    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingId]);

    const startEditing = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditTitle(currentTitle);
        setOpenMenuId(null);
    };

    const handleSaveEdit = async (branchId: string, isGoal: boolean) => {
        if (!editTitle.trim()) {
            setEditingId(null);
            return;
        }

        setIsSaving(true);
        try {
            if (isGoal) {
                const res = await fetch(`/api/trees/${treeId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ goalTitle: editTitle }),
                });
                if (!res.ok) throw new Error('Erreur modification objectif');
            } else {
                const res = await fetch(`/api/trees/${treeId}/branches/${branchId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ branchTitle: editTitle }),
                });
                if (!res.ok) throw new Error('Erreur modification branche');
            }

            setEditingId(null);
            if (onUpdate) onUpdate();
        } catch (error) {
            addNotification({ title: 'Erreur', type: 'error', message: 'Impossible de modifier le titre.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: string, isGoal: boolean) => {
        if (e.key === 'Enter') handleSaveEdit(id, isGoal);
        if (e.key === 'Escape') setEditingId(null);
    };

    const handleDeleteBranch = async (branchId: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cette séance de révision ?')) return;

        setDeletingId(branchId);
        setOpenMenuId(null);

        try {
            const res = await fetch(`/api/trees/${treeId}/branches/${branchId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Suppression échouée');

            addNotification({ title: 'Séance supprimée', type: 'info', message: 'La séance a été retirée de l\'arbre.' });
            if (onUpdate) onUpdate();
        } catch (error) {
            addNotification({ title: 'Erreur', type: 'error', message: 'Impossible de supprimer la séance.' });
            setDeletingId(null);
        }
    };

    const allItems = [
        ...branches.map(b => ({ ...b, type: 'branch' as const })),
        { type: 'goal' as const, id: 'goal', title: goalTitle, completed: isGoalPast },
    ];

    return (
        <div className="relative">
            {/* Container scrollable si trop d'items */}
            <div className="overflow-x-auto pb-2">
                <div className="flex items-start min-w-max">
                    {allItems.map((item, index) => {
                        const isLast = index === allItems.length - 1;
                        const isGoal = item.type === 'goal';
                        const isCompleted = isGoal ? isGoalPast : (item as BranchData).completed;

                        return (
                            <div key={index} className="flex items-start">
                                {/* Node */}
                                <div className="flex flex-col items-center" style={{ width: '100px' }}>
                                    {/* Cercle */}
                                    <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isGoal
                                        ? isCompleted
                                            ? 'bg-notion-green border-notion-green'
                                            : 'bg-notion-red/10 border-notion-red'
                                        : isCompleted
                                            ? 'bg-notion-green border-notion-green'
                                            : 'bg-notion-bg border-notion-border'
                                        }`}>
                                        {isGoal ? (
                                            isCompleted ? (
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            ) : (
                                                <Calendar className="w-4 h-4 text-notion-red" />
                                            )
                                        ) : isCompleted ? (
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-notion-textLight" />
                                        )}
                                    </div>

                                    {/* Menu contextuel pour les branches */}
                                    {!isGoal && (
                                        <div className="absolute -top-6" ref={el => { if (el) menusRef.current[(item as BranchData).id] = el; }}>
                                            <div className="relative group">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === (item as BranchData).id ? null : (item as BranchData).id)}
                                                    className={`p-1 rounded bg-notion-bg border border-notion-border shadow-sm transition-opacity ${openMenuId === (item as BranchData).id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 hover:opacity-100'}`}
                                                    disabled={deletingId === (item as BranchData).id}
                                                >
                                                    {deletingId === (item as BranchData).id ? <Loader2 className="w-3 h-3 animate-spin text-notion-textLight" /> : <MoreHorizontal className="w-3 h-3 text-notion-textLight" />}
                                                </button>

                                                {openMenuId === (item as BranchData).id && (
                                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-36 bg-notion-bg border border-notion-border rounded-md shadow-lg py-1 z-20">
                                                        <button
                                                            className="w-full text-left px-3 py-1.5 text-xs text-notion-text hover:bg-notion-hover flex items-center gap-2"
                                                            onClick={() => startEditing((item as BranchData).id, (item as BranchData).branchTitle)}
                                                        >
                                                            <Edit3 className="w-3 h-3" /> Modifier
                                                        </button>
                                                        <button
                                                            className="w-full text-left px-3 py-1.5 text-xs text-notion-red hover:bg-notion-red/10 flex items-center gap-2"
                                                            onClick={() => handleDeleteBranch((item as BranchData).id)}
                                                        >
                                                            <Trash className="w-3 h-3" /> Supprimer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Label */}
                                    <div className="mt-3 text-center px-1">
                                        {editingId === (item as any).id || (isGoal && editingId === 'goal') ? (
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, isGoal ? 'goal' : (item as BranchData).id, isGoal)}
                                                onBlur={() => handleSaveEdit(isGoal ? 'goal' : (item as BranchData).id, isGoal)}
                                                disabled={isSaving}
                                                className="text-xs font-medium text-center w-[90px] bg-transparent border-b border-notion-blue focus:outline-none"
                                            />
                                        ) : (
                                            <p className={`text-xs font-medium truncate max-w-[90px] ${isGoal ? 'text-notion-text' : 'text-notion-text'
                                                }`} title={isGoal ? goalTitle : (item as BranchData).branchTitle}>
                                                {isGoal ? goalTitle : (item as BranchData).branchTitle}
                                            </p>
                                        )}
                                        {!isGoal && (
                                            <p className="text-[10px] text-notion-textLight mt-0.5">
                                                {formatDateShort(new Date((item as BranchData).branchDate))}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Ligne de connexion */}
                                {!isLast && (
                                    <div className="flex items-center h-8">
                                        <div className={`w-8 h-0.5 ${isCompleted ? 'bg-notion-green' : 'bg-notion-border'
                                            }`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
