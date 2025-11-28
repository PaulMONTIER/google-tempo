'use client';

import { useState, useEffect } from 'react';
import { X, GitBranch, Calendar, CheckCircle, Loader2 } from '@/components/icons';
import { CalendarEvent } from '@/types';

interface ArbrePanelProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
}

interface TreeGoal {
  id: string;
  name: string;
  date: Date;
  branches: CalendarEvent[];
}

export function ArbrePanel({ isOpen, onClose, events }: ArbrePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [trees, setTrees] = useState<TreeGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      analyzeEvents();
    } else {
      setIsVisible(false);
    }
  }, [isOpen, events]);

  const analyzeEvents = async () => {
    if (events.length === 0) {
      setTrees([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, try to find trees using annotations in descriptions
      const annotatedTrees = findAnnotatedTrees();

      if (annotatedTrees.length > 0) {
        setTrees(annotatedTrees);
      } else {
        // Fallback to AI analysis for events without annotations
        await analyzeEventsWithAI();
      }
    } catch (err: any) {
      console.error('Error analyzing trees:', err);
      setError(err.message || 'Erreur d\'analyse');
      setTrees([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Find trees using <!--tree:ID:type--> annotations
  const findAnnotatedTrees = (): TreeGoal[] => {
    const treeMap = new Map<string, { goal: CalendarEvent | null; branches: CalendarEvent[] }>();

    events.forEach(event => {
      const description = event.description || '';
      const match = description.match(/<!--tree:([^:]+):(goal|branch)-->/);

      if (match) {
        const [, treeId, type] = match;

        if (!treeMap.has(treeId)) {
          treeMap.set(treeId, { goal: null, branches: [] });
        }

        const tree = treeMap.get(treeId)!;

        if (type === 'goal') {
          tree.goal = event;
        } else {
          tree.branches.push(event);
        }
      }
    });

    // Convert map to array, filtering out incomplete trees
    const result: TreeGoal[] = [];

    treeMap.forEach((tree, treeId) => {
      if (tree.goal && tree.branches.length > 0) {
        result.push({
          id: tree.goal.id,
          name: tree.goal.title,
          date: new Date(tree.goal.start || tree.goal.startDate),
          branches: tree.branches.sort((a, b) =>
            new Date(a.start || a.startDate).getTime() - new Date(b.start || b.startDate).getTime()
          ),
        });
      }
    });

    return result;
  };

  const analyzeEventsWithAI = async () => {
    const response = await fetch('/api/analyze-trees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'analyse');
    }

    const data = await response.json();

    // Convert API response to TreeGoal format
    const detectedTrees: TreeGoal[] = data.trees
      .map((tree: any) => {
        const goalEvent = events.find(e => e.id === tree.goalId);
        if (!goalEvent) return null;

        const branchEvents = tree.branchIds
          .map((id: string) => events.find(e => e.id === id))
          .filter((e: CalendarEvent | undefined) => e !== undefined)
          .sort((a: CalendarEvent, b: CalendarEvent) =>
            new Date(a.start || a.startDate).getTime() - new Date(b.start || b.startDate).getTime()
          );

        return {
          id: goalEvent.id,
          name: tree.goalTitle || goalEvent.title,
          date: new Date(goalEvent.start || goalEvent.startDate),
          branches: branchEvents,
        };
      })
      .filter((tree: TreeGoal | null) => tree !== null);

    setTrees(detectedTrees);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const isPast = (date: Date) => {
    return new Date(date) < new Date();
  };

  const getEventDate = (event: CalendarEvent): Date => {
    return new Date((event as any).start || event.startDate);
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`w-full max-w-3xl max-h-[85vh] bg-notion-bg rounded-xl shadow-2xl pointer-events-auto transition-all duration-300 ease-out flex flex-col ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Header */}
          <div className="bg-notion-bg border-b border-notion-border px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-notion-text">Arbre de préparation</h2>
              <p className="text-sm text-notion-textLight mt-0.5">
                Visualisez vos événements de préparation vers vos objectifs
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-notion-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-notion-textLight" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="text-center py-12 text-notion-textLight">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                <p className="text-sm">Analyse des événements en cours...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-notion-red">
                <p className="text-sm">{error}</p>
                <button
                  onClick={analyzeEvents}
                  className="mt-4 px-4 py-2 bg-notion-blue text-white rounded-lg text-sm hover:opacity-90"
                >
                  Réessayer
                </button>
              </div>
            ) : trees.length === 0 ? (
              <div className="text-center py-12 text-notion-textLight">
                <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Aucun arbre détecté</p>
                <p className="text-sm max-w-md mx-auto">
                  Créez des événements de révision liés à un contrôle ou examen pour voir apparaître un arbre de préparation.
                </p>
                <p className="text-xs mt-4 text-notion-textLight/70">
                  Exemple : "Place des révisions pour mon contrôle de math du 25"
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {trees.map((tree) => (
                  <div key={tree.id} className="border border-notion-border rounded-lg p-4">
                    {/* Goal (trunk top) */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-notion-border">
                      <div className="w-10 h-10 bg-notion-blue/20 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-notion-blue" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-notion-text">{tree.name}</h3>
                        <p className="text-sm text-notion-textLight">{formatDate(tree.date)}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isPast(tree.date)
                          ? 'bg-notion-green/20 text-notion-green'
                          : 'bg-notion-orange/20 text-notion-orange'
                      }`}>
                        {isPast(tree.date) ? 'Terminé' : 'À venir'}
                      </div>
                    </div>

                    {/* Branches (preparation events) */}
                    <div className="relative pl-6">
                      {/* Vertical line */}
                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-notion-border" />

                      <div className="space-y-3">
                        {tree.branches.map((branch) => (
                          <div key={branch.id} className="relative flex items-center gap-3">
                            {/* Branch connector */}
                            <div className="absolute -left-3 w-3 h-0.5 bg-notion-border" />

                            {/* Branch node */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isPast(getEventDate(branch))
                                ? 'bg-notion-green/20'
                                : 'bg-notion-sidebar'
                            }`}>
                              {isPast(getEventDate(branch)) ? (
                                <CheckCircle className="w-4 h-4 text-notion-green" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-notion-textLight" />
                              )}
                            </div>

                            {/* Branch content */}
                            <div className="flex-1 py-2 px-3 bg-notion-sidebar/50 rounded-lg">
                              <p className="text-sm font-medium text-notion-text">{branch.title}</p>
                              <p className="text-xs text-notion-textLight">{formatDate(getEventDate(branch))}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-4 pt-4 border-t border-notion-border">
                      <p className="text-xs text-notion-textLight">
                        {tree.branches.filter(b => isPast(getEventDate(b))).length} / {tree.branches.length} étapes complétées
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-notion-border px-6 py-4 flex-shrink-0">
            <p className="text-xs text-notion-textLight text-center">
              Les arbres sont détectés automatiquement à partir des annotations dans vos événements
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
