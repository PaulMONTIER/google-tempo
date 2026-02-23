import { useState, useEffect } from 'react';
import { X, Plus, Trash, Calendar as CalendarIcon, Edit3, Loader2, Check } from '@/components/ui/icons';
import { TreeData, BranchData } from '@/lib/services/tree-service';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { formatDateShort } from '@/lib/utils/date-formatters';

interface TreeEditModalProps {
    tree: TreeData;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

type EditableBranch = BranchData & { isNew?: boolean, isDeleted?: boolean };

export function TreeEditModal({ tree, isOpen, onClose, onUpdate }: TreeEditModalProps) {
    const { addNotification } = useNotifications();
    const [isVisible, setIsVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [goalTitle, setGoalTitle] = useState(tree.goalTitle);
    const [goalDate, setGoalDate] = useState(() => new Date(tree.goalDate).toISOString().split('T')[0]);
    const [branches, setBranches] = useState<EditableBranch[]>([]);

    useEffect(() => {
        if (isOpen) {
            setGoalTitle(tree.goalTitle);
            setGoalDate(new Date(tree.goalDate).toISOString().split('T')[0]);
            setBranches(tree.branches.map(b => ({ ...b, isDeleted: false })));
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
        }
    }, [isOpen, tree]);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, DURATIONS.animation);
    };

    const handleAddBranch = () => {
        const newBranch: EditableBranch = {
            id: `temp_${Date.now()}`,
            branchEventId: `manual_${Date.now()}`,
            branchTitle: 'Nouvelle séance',
            branchDate: new Date(),
            order: branches.length,
            completed: false,
            isNew: true,
            isDeleted: false,
        };
        setBranches([...branches, newBranch]);
    };

    const handleUpdateBranch = (id: string, field: keyof EditableBranch, value: any) => {
        setBranches(branches.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleDeleteBranch = (id: string) => {
        setBranches(branches.map(b => b.id === id ? { ...b, isDeleted: true } : b));
    };

    const handleSave = async () => {
        if (!goalTitle.trim()) {
            addNotification({ title: 'Erreur', message: 'Le titre de l\'objectif est requis', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            // 1. Update Goal
            let goalChanged = goalTitle !== tree.goalTitle || goalDate !== new Date(tree.goalDate).toISOString().split('T')[0];
            if (goalChanged) {
                await fetch(`/api/trees/${tree.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ goalTitle, goalDate: new Date(goalDate).toISOString() }),
                });
            }

            // 2. Update Branches
            for (const branch of branches) {
                if (branch.isDeleted && !branch.isNew) {
                    // Delete existing
                    await fetch(`/api/trees/${tree.id}/branches/${branch.id}`, { method: 'DELETE' });
                } else if (branch.isNew && !branch.isDeleted) {
                    // Create new
                    await fetch(`/api/trees/${tree.treeId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            branchEventId: branch.branchEventId,
                            branchTitle: branch.branchTitle,
                            branchDate: new Date(branch.branchDate).toISOString(),
                            order: branch.order,
                        }),
                    });
                } else if (!branch.isNew && !branch.isDeleted) {
                    // Check for changes in existing
                    const original = tree.branches.find(b => b.id === branch.id);
                    const dateStr1 = new Date(branch.branchDate).toISOString().split('T')[0];
                    const dateStr2 = original ? new Date(original.branchDate).toISOString().split('T')[0] : '';

                    if (original && (branch.branchTitle !== original.branchTitle || dateStr1 !== dateStr2)) {
                        await fetch(`/api/trees/${tree.id}/branches/${branch.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                branchTitle: branch.branchTitle,
                                branchDate: new Date(branch.branchDate).toISOString(),
                            }),
                        });
                    }
                }
            }

            addNotification({ title: 'Succès', message: 'L\'arbre a été mis à jour avec succès.', type: 'success' });
            onUpdate();
            handleClose();
        } catch (error) {
            console.error(error);
            addNotification({ title: 'Erreur', message: 'Une erreur est survenue lors de la sauvegarde.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const visibleBranches = branches.filter(b => !b.isDeleted);

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                style={{
                    zIndex: Z_INDEX.modalOverlay + 10,
                    transitionDuration: `${DURATIONS.animation}ms`,
                    opacity: isVisible ? 1 : 0
                }}
                onClick={handleClose}
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: Z_INDEX.modal + 10 }}>
                <div
                    className={`w-full max-w-2xl max-h-[90vh] bg-notion-bg rounded-xl shadow-2xl pointer-events-auto transition-all ease-out flex flex-col ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    style={{ transitionDuration: `${DURATIONS.animation}ms` }}
                >
                    {/* Header */}
                    <div className="border-b border-notion-border px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
                        <h2 className="text-lg font-semibold text-notion-text flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-notion-textLight" />
                            Modifier l'arbre de préparation
                        </h2>
                        <button onClick={handleClose} className="p-2 hover:bg-notion-hover rounded-lg transition-colors">
                            <X className="w-5 h-5 text-notion-textLight" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Objectif Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-notion-text bg-notion-hover px-3 py-1 rounded inline-block">1. Objectif principal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 pl-1">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-notion-textLight">Titre de l'objectif</label>
                                    <input
                                        type="text"
                                        value={goalTitle}
                                        onChange={(e) => setGoalTitle(e.target.value)}
                                        className="w-full px-3 py-2 bg-transparent border border-notion-border rounded-lg text-sm focus:outline-none focus:border-notion-blue transition-colors text-notion-text"
                                        placeholder="Ex: Partiel de Mathématiques"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-notion-textLight">Date cible</label>
                                    <input
                                        type="date"
                                        value={goalDate}
                                        onChange={(e) => setGoalDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-transparent border border-notion-border rounded-lg text-sm focus:outline-none focus:border-notion-blue transition-colors text-notion-text"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-notion-border w-full" />

                        {/* Branches Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-notion-text bg-notion-hover px-3 py-1 rounded inline-block">2. Séances de révision</h3>
                                <span className="text-xs text-notion-textLight px-2">{visibleBranches.length} séance(s)</span>
                            </div>

                            <div className="space-y-3 pl-1">
                                {visibleBranches.length === 0 ? (
                                    <p className="text-sm text-notion-textLight italic py-4 text-center border-2 border-dashed border-notion-border rounded-lg">
                                        Aucune séance. Ajoutez-en une pour commencer !
                                    </p>
                                ) : (
                                    visibleBranches.map((branch, index) => (
                                        <div key={branch.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-notion-bg hover:bg-notion-hover/50 p-3 rounded-lg border border-notion-border transition-colors group">
                                            <div className="text-xs font-medium text-notion-textLight w-6 flex-shrink-0 text-center">
                                                {index + 1}.
                                            </div>
                                            <input
                                                type="text"
                                                value={branch.branchTitle}
                                                onChange={(e) => handleUpdateBranch(branch.id, 'branchTitle', e.target.value)}
                                                className="flex-1 px-3 py-1.5 bg-transparent border border-transparent hover:border-notion-border focus:border-notion-blue rounded text-sm focus:outline-none transition-colors text-notion-text"
                                                placeholder="Titre de la séance"
                                            />
                                            <div className="flex items-center gap-2 sm:w-auto w-full justify-between sm:justify-end">
                                                <input
                                                    type="date"
                                                    value={new Date(branch.branchDate).toISOString().split('T')[0]}
                                                    onChange={(e) => handleUpdateBranch(branch.id, 'branchDate', new Date(e.target.value))}
                                                    className="px-2 py-1 bg-transparent border border-transparent hover:border-notion-border focus:border-notion-blue rounded text-sm focus:outline-none transition-colors text-notion-textLight"
                                                />
                                                <button
                                                    onClick={() => handleDeleteBranch(branch.id)}
                                                    className="p-1.5 text-notion-textLight hover:text-notion-red hover:bg-notion-red/10 rounded transition-colors"
                                                    title="Supprimer la séance"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}

                                <button
                                    onClick={handleAddBranch}
                                    className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-sm font-medium text-notion-textLight hover:text-notion-text hover:bg-notion-hover border border-dashed border-notion-border rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter une séance
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-notion-border px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl bg-notion-bg">
                        <button
                            onClick={handleClose}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-notion-text rounded-lg hover:bg-notion-hover transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-notion-bg bg-notion-text rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sauvegarde...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Enregistrer
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
