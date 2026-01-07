'use client';

import { useState, KeyboardEvent } from 'react';
import { useSkills } from '@/hooks/use-skills';
import { useUserProgress } from '@/hooks/use-user-progress';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { SkillsRadarChart } from '@/components/progression/SkillsRadarChart';
import { BookOpen, Trophy, Lock, Check, User, Edit3, X, Plus, Save } from 'lucide-react';

const SUGGESTIONS = [
    'Mathématiques', 'Physique', 'Chimie', 'Informatique', 'Biologie',
    'Droit', 'Économie', 'Gestion', 'Marketing', 'Finance',
    'Langues', 'Histoire', 'Philosophie', 'Littérature', 'Médecine',
];

/**
 * Onglet Compétences - Style Apple/Notion (identique à ArenaTab)
 */
export function SkillsTab() {
    const { skills, isLoading: skillsLoading, error: skillsError, refetch: refetchSkills } = useSkills();
    const { stats } = useUserProgress();
    const { preferences, refetch: refetchPreferences } = useUserPreferences();

    const [isEditing, setIsEditing] = useState(false);
    const [editSubjects, setEditSubjects] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (skillsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-blue" />
            </div>
        );
    }

    if (skillsError) {
        return (
            <div className="text-center py-8">
                <p className="text-notion-red">{skillsError}</p>
            </div>
        );
    }

    // Calculs
    const totalSkills = skills.length;
    const avgLevel = totalSkills > 0
        ? Math.round(skills.reduce((sum, s) => sum + s.level, 0) / totalSkills)
        : 0;
    const totalSkillXp = skills.reduce((sum, s) => sum + s.xp, 0);

    // Meilleure compétence
    const topSkill = skills.length > 0
        ? skills.reduce((best, s) => s.level > best.level ? s : best, skills[0])
        : null;

    // Matières du profil
    const userSubjects = preferences?.studySubjects || [];

    // Édition des matières - utiliser skills comme source de vérité
    const openEditor = () => {
        // Utiliser les noms des skills actuels (pas preferences qui peut être désynchronisé)
        setEditSubjects(skills.map(s => s.name));
        setIsEditing(true);
    };

    const addSubject = (subject: string) => {
        const trimmed = subject.trim();
        if (trimmed && !editSubjects.includes(trimmed)) {
            setEditSubjects([...editSubjects, trimmed]);
        }
        setInputValue('');
    };

    const removeSubject = (subject: string) => {
        setEditSubjects(editSubjects.filter(s => s !== subject));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            addSubject(inputValue);
        }
    };

    const saveSubjects = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/user/preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studySubjects: editSubjects }),
            });

            if (response.ok) {
                await refetchPreferences();
                await refetchSkills(); // Recharger les compétences
                setIsEditing(false);
            } else {
                alert('Erreur lors de la sauvegarde');
            }
        } catch {
            alert('Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredSuggestions = SUGGESTIONS.filter(
        s => !editSubjects.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
    );

    return (
        <div className="space-y-5">
            {/* Hero Card - Résumé compétences */}
            <div className="p-6 rounded-xl border border-notion-border bg-notion-bg">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-notion-sidebar flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-notion-textLight" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-notion-textLight uppercase tracking-wide">Compétences</p>
                        <p className="text-2xl font-semibold text-notion-text mt-1">{totalSkills} familles</p>
                        <p className="text-sm text-notion-textLight">Niveau moyen {avgLevel}%</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-semibold text-notion-text">{totalSkillXp.toLocaleString()}</p>
                        <p className="text-xs text-notion-textLight">XP total</p>
                    </div>
                </div>

                {/* Progression vers maîtrise */}
                {topSkill && (
                    <div className="mt-5 pt-5 border-t border-notion-border">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-notion-textLight">Meilleure : {topSkill.name}</span>
                            <span className="font-medium text-notion-text">{topSkill.level}%</span>
                        </div>
                        <div className="h-2 bg-notion-sidebar rounded-full overflow-hidden">
                            <div
                                className="h-full bg-notion-blue rounded-full transition-all duration-500"
                                style={{ width: `${topSkill.level}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Matières du profil */}
            <div className="p-5 rounded-xl border border-notion-border bg-notion-bg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-notion-textLight" />
                        <p className="text-sm font-medium text-notion-text">Tes matières</p>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={openEditor}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-notion-textLight hover:bg-notion-hover hover:text-notion-text transition-colors"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            Modifier
                        </button>
                    )}
                </div>

                {isEditing ? (
                    // Mode édition
                    <div className="space-y-4">
                        {/* Tags sélectionnés */}
                        {editSubjects.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {editSubjects.map((subject) => (
                                    <span
                                        key={subject}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-notion-blue/10 text-notion-blue text-sm font-medium"
                                    >
                                        {subject}
                                        <button
                                            onClick={() => removeSubject(subject)}
                                            className="p-0.5 hover:bg-notion-blue/20 rounded-full transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Input avec bouton + */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tape une matière..."
                                className="flex-1 px-4 py-2.5 rounded-lg border border-notion-border bg-notion-bg text-notion-text placeholder:text-notion-textLight focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent text-sm"
                            />
                            <button
                                onClick={() => inputValue.trim() && addSubject(inputValue)}
                                disabled={!inputValue.trim()}
                                className="px-4 py-2.5 rounded-lg bg-notion-blue text-white font-medium hover:bg-notion-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Suggestions */}
                        <div className="flex flex-wrap gap-2">
                            {filteredSuggestions.slice(0, 6).map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => addSubject(suggestion)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-notion-border text-xs text-notion-text hover:border-notion-blue hover:bg-notion-blue/5 transition-all"
                                >
                                    <Plus className="w-3 h-3" />
                                    {suggestion}
                                </button>
                            ))}
                        </div>

                        {/* Boutons */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-notion-border text-sm text-notion-text hover:bg-notion-hover transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={saveSubjects}
                                disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-notion-blue text-white text-sm font-medium hover:bg-notion-blue/90 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                        </div>
                    </div>
                ) : (
                    // Mode lecture - utiliser skills car c'est la source de vérité
                    skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                                <span
                                    key={skill.id}
                                    className="px-3 py-1.5 rounded-lg bg-notion-sidebar text-sm text-notion-text"
                                >
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-notion-textLight">
                            Aucune matière sélectionnée. Clique sur Modifier pour en ajouter.
                        </p>
                    )
                )}
            </div>

            {/* Radar Chart */}
            {skills.length > 0 && (
                <div className="p-5 rounded-xl border border-notion-border bg-notion-bg">
                    <p className="text-sm font-medium text-notion-text mb-4">Vue d'ensemble</p>
                    <div className="h-64">
                        <SkillsRadarChart skills={skills} />
                    </div>
                </div>
            )
            }

            {/* Toutes les compétences */}
            <div className="p-5 rounded-xl border border-notion-border bg-notion-bg">
                <p className="text-sm font-medium text-notion-text mb-4">Toutes les compétences</p>
                <div className="space-y-2">
                    {skills.length === 0 ? (
                        <div className="text-center py-6">
                            <BookOpen className="w-10 h-10 mx-auto mb-3 text-notion-textLight" />
                            <p className="text-sm text-notion-textLight">
                                Validez des tâches pour progresser.
                            </p>
                        </div>
                    ) : (
                        skills.map((skill) => {
                            const isTop = topSkill?.id === skill.id;
                            const isMastered = skill.level >= 80;

                            return (
                                <div
                                    key={skill.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isTop ? 'bg-notion-sidebar' : 'hover:bg-notion-hover'
                                        }`}
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isMastered ? 'bg-green-100 dark:bg-green-900/30' : 'bg-notion-sidebar'
                                        }`}>
                                        {isMastered ? (
                                            <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        ) : skill.level > 0 ? (
                                            <BookOpen className="w-4 h-4 text-notion-textLight" />
                                        ) : (
                                            <Lock className="w-4 h-4 text-notion-textLight opacity-50" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${skill.level > 0 ? 'text-notion-text' : 'text-notion-textLight'}`}>
                                            {skill.name}
                                        </p>
                                        <p className="text-xs text-notion-textLight">{skill.xp} XP</p>
                                    </div>
                                    {isTop && (
                                        <span className="text-xs font-medium text-notion-blue">Meilleure</span>
                                    )}
                                    {isMastered && !isTop && (
                                        <Check className="w-4 h-4 text-green-500" />
                                    )}
                                    <span className="text-sm font-medium text-notion-text">{skill.level}%</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div >
    );
}
