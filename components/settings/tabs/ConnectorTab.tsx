import { useState, useEffect } from 'react';
import { Plug, Loader2, CheckCircle, Activity } from '@/components/ui/icons';
import { useNotifications } from '@/components/notifications/NotificationSystem';

export function ConnectorTab() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const { addNotification } = useNotifications();

    // Check if demo data (Strava) is already seeded
    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Fetch user skills to see if "Course à pied" exists with high level (demo data marker)
                const res = await fetch('/api/gamification/skills');
                const data = await res.json();

                if (data.skills && data.skills.find((s: any) => s.name === "Course à pied" && s.level >= 70)) {
                    setIsConnected(true);
                }
            } catch (error) {
                console.error("Erreur vérification Strava:", error);
            }
        };
        checkConnection();
    }, []);

    const handleConnectStrava = async () => {
        setIsConnecting(true);

        try {
            const res = await fetch('/api/dev/seed-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'seed' }), // Reuse general seed for demo purposes
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Erreur de connexion');

            addNotification({
                title: 'Strava Connecté',
                message: 'Vos sessions de sport (passées et futures) ont été synchronisées.',
                type: 'success'
            });

            setIsConnected(true);

            // Refresh to see new data
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error: any) {
            console.error(error);
            addNotification({
                title: 'Erreur',
                message: error.message || 'Impossible de connecter Strava.',
                type: 'error'
            });
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-notion-text">Connecteurs (Intégrations)</h3>
                <p className="text-sm text-notion-textLight mt-1">
                    Liez Tempo à vos applications préférées pour synchroniser vos activités sportives, académiques et professionnelles de manière proactive.
                </p>
            </div>

            {/* Strava Integration */}
            <div className="bg-notion-sidebar/30 border border-notion-border rounded-xl p-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fc4c02]/10 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-6 h-6 text-[#fc4c02]" />
                        </div>
                        <div>
                            <h4 className="font-medium text-notion-text text-base">Strava</h4>
                            <p className="text-sm text-notion-textLight mt-1 max-w-md">
                                Importation automatique de vos entraînements et courses de course à pied, vélo et natation. Idéal pour que Tempo respecte vos temps de récupération et planifie les révisions en conséquence.
                            </p>
                        </div>
                    </div>

                    <div>
                        {isConnected ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg text-sm font-medium">
                                <CheckCircle className="w-4 h-4" />
                                Connecté
                            </div>
                        ) : (
                            <button
                                onClick={handleConnectStrava}
                                disabled={isConnecting}
                                className="flex items-center gap-2 px-4 py-2 bg-[#fc4c02] text-white font-medium text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Connexion...
                                    </>
                                ) : (
                                    <>
                                        <Plug className="w-4 h-4" />
                                        Connecter Strava
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Placeholder for future integrations */}
            <div className="bg-notion-sidebar/30 border border-notion-border rounded-xl p-5 opacity-50 grayscale">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-6 h-6 text-gray-500" />
                        </div>
                        <div>
                            <h4 className="font-medium text-notion-text text-base">Garmin Connect (Bientôt)</h4>
                            <p className="text-sm text-notion-textLight mt-1 max-w-md">
                                Synchronisation de votre Garmin Body Battery, sommeil et VFC pour adapter parfaitement votre charge de révision à votre état de forme réel.
                            </p>
                        </div>
                    </div>
                    <button disabled className="px-4 py-2 bg-notion-bg border border-notion-border text-notion-textLight rounded-lg text-sm font-medium cursor-not-allowed">
                        Bientôt disponible
                    </button>
                </div>
            </div>
        </div>
    );
}
