'use client';

import { Mic } from '@/components/icons';
import { Section } from '../components/Section';
import { ToggleSetting } from '../components/ToggleSetting';
import type { UserSettings } from '@/components/providers/settings-provider';

interface VoiceTabProps {
    settings: UserSettings;
    updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

/**
 * Tab des paramètres de l'assistant vocal
 */
export function VoiceTab({ settings, updateSetting }: VoiceTabProps) {
    return (
        <div className="space-y-6">
            <Section title="Assistant vocal" icon={Mic}>
                <div className="space-y-4">
                    <ToggleSetting
                        label="Couper le micro après chaque phrase"
                        description="Quand activé, le micro s'arrête après votre demande. Quand désactivé, le micro reste actif pour plusieurs demandes à Tempo."
                        enabled={settings.voiceAutoStop}
                        onChange={(value) => updateSetting('voiceAutoStop', value)}
                    />
                </div>
            </Section>
        </div>
    );
}
