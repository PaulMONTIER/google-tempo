import { useState } from 'react';
import { Database, Loader2, AlertTriangle } from '@/components/ui/icons';
import { useNotifications } from '@/components/notifications/NotificationSystem';

export function DemoTab() {
    const [isSeeding, setIsSeeding] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const { addNotification } = useNotifications();

    const handleDataAction = async (action: 'seed' | 'clear') => {
        if (action === 'seed' && !confirm('Attention: Cette action va écraser vos arbres de préparation MOCK et vos statistiques actuelles. Continuer ?')) {
            return;
        }
        if (action === 'clear' && !confirm('Êtes-vous sûr de vouloir supprimer les données de simulation et réinitialiser vos statistiques à zéro ?')) {
            return;
        }

        const setLoader = action === 'seed' ? setIsSeeding : setIsClearing;
        setLoader(true);

        try {
            const res = await fetch('/api/dev/seed-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'opération');

            addNotification({
                title: action === 'seed' ? 'Mode Démo activé' : 'Données nettoyées',
                message: data.message,
                type: 'success'
            });

            // Refresh to see new data
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error: any) {
            console.error(error);
            addNotification({
                title: 'Erreur',
                message: error.message || 'Impossible de modifier les données.',
                type: 'error'
            });
        } finally {
            setLoader(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-notion-text">Mode Démo (Hardcodé)</h3>
                <p className="text-sm text-notion-textLight mt-1">
                    Outils développeur pour simuler une utilisation intensive de Tempo.
                </p>
            </div>

            <div className="bg-notion-sidebar/30 border border-notion-border rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <Database className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h4 className="font-medium text-notion-text">Générer des données de test</h4>
                        <p className="text-sm text-notion-textLight mt-1 mb-4">
                            Injecte ou nettoie instantanément des données fictives pour tester toutes les fonctionnalités (Arbres, Quêtes, Statistiques).
                        </p>

                        <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-600 rounded-lg text-xs mb-4">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <p>Attention: Cela n'affecte pas votre Google Calendar, mais modifiera vos statistiques locales Tempo.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => handleDataAction('seed')}
                                disabled={isSeeding || isClearing}
                                className="flex items-center gap-2 px-4 py-2 bg-notion-text text-notion-bg font-medium text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isSeeding ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Injection...
                                    </>
                                ) : (
                                    <>
                                        <Database className="w-4 h-4" />
                                        Injecter les données
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => handleDataAction('clear')}
                                disabled={isSeeding || isClearing}
                                className="flex items-center gap-2 px-4 py-2 bg-notion-bg text-notion-red border border-notion-border border-notion-red/20 font-medium text-sm rounded-lg hover:bg-notion-red/5 transition-colors disabled:opacity-50"
                            >
                                {isClearing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Nettoyage...
                                    </>
                                ) : (
                                    <>
                                        Nettoyer les données
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
