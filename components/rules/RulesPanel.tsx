'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash, Play, Pause, Zap } from '@/components/icons';

interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  createdAt: Date;
}

interface RulesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RulesPanel({ isOpen, onClose }: RulesPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      // Load rules from localStorage
      const savedRules = localStorage.getItem('tempo-rules');
      if (savedRules) {
        setRules(JSON.parse(savedRules));
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const saveRules = (updatedRules: Rule[]) => {
    setRules(updatedRules);
    localStorage.setItem('tempo-rules', JSON.stringify(updatedRules));
  };

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.description) return;

    const rule: Rule = {
      id: Date.now().toString(),
      name: newRule.name,
      description: newRule.description,
      enabled: true,
      createdAt: new Date(),
    };

    saveRules([...rules, rule]);
    setNewRule({ name: '', description: '' });
    setIsCreating(false);
  };

  const handleDeleteRule = (id: string) => {
    saveRules(rules.filter(r => r.id !== id));
  };

  const handleToggleRule = (id: string) => {
    saveRules(rules.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
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
          className={`w-full max-w-2xl max-h-[85vh] bg-notion-bg rounded-xl shadow-2xl pointer-events-auto transition-all duration-300 ease-out flex flex-col ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Header */}
          <div className="bg-notion-bg border-b border-notion-border px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-notion-text">Règles automatiques</h2>
              <p className="text-sm text-notion-textLight mt-0.5">
                Configurez des actions automatiques pour Tempo
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
            {/* Create new rule */}
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-notion-border rounded-lg text-notion-textLight hover:border-notion-blue hover:text-notion-blue transition-colors mb-6"
              >
                <Plus className="w-5 h-5" />
                Créer une nouvelle règle
              </button>
            ) : (
              <div className="bg-notion-sidebar/50 rounded-lg p-4 mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-notion-text mb-2">
                    Nom de la règle
                  </label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="Ex: Résumé matinal"
                    className="w-full px-3 py-2 bg-notion-bg border border-notion-border rounded-lg text-notion-text placeholder:text-notion-textLight focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-notion-text mb-2">
                    Description (action à exécuter)
                  </label>
                  <textarea
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    placeholder="Ex: Tous les matins à 8h, affiche les événements de la journée"
                    rows={3}
                    className="w-full px-3 py-2 bg-notion-bg border border-notion-border rounded-lg text-notion-text placeholder:text-notion-textLight focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-4 py-2 border border-notion-border rounded-lg text-notion-text hover:bg-notion-hover transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateRule}
                    disabled={!newRule.name || !newRule.description}
                    className="flex-1 px-4 py-2 bg-notion-blue text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Créer
                  </button>
                </div>
              </div>
            )}

            {/* Rules list */}
            {rules.length === 0 ? (
              <div className="text-center py-12 text-notion-textLight">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Aucune règle configurée</p>
                <p className="text-sm">
                  Créez des règles pour automatiser vos interactions avec Tempo
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      rule.enabled
                        ? 'border-notion-border bg-notion-bg'
                        : 'border-notion-border/50 bg-notion-sidebar/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-notion-text">{rule.name}</h3>
                        <p className="text-sm text-notion-text mt-2 bg-notion-sidebar/50 rounded px-2 py-1">
                          {rule.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            rule.enabled
                              ? 'text-notion-green hover:bg-notion-green/10'
                              : 'text-notion-textLight hover:bg-notion-hover'
                          }`}
                          title={rule.enabled ? 'Désactiver' : 'Activer'}
                        >
                          {rule.enabled ? (
                            <Play className="w-4 h-4" />
                          ) : (
                            <Pause className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2 text-notion-textLight hover:text-notion-red hover:bg-notion-red/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-notion-border px-6 py-4 flex-shrink-0">
            <p className="text-xs text-notion-textLight text-center">
              Les règles sont exécutées automatiquement selon leur déclencheur configuré
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
