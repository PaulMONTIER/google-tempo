import { ReactNode } from 'react';

interface SectionProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: ReactNode;
}

/**
 * Composant Section réutilisable pour la progression
 * Identique au style des Settings
 */
export function Section({ title, icon: Icon, children }: SectionProps) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-5 h-5 text-notion-textLight" />
                <h3 className="text-base font-semibold text-notion-text">{title}</h3>
            </div>
            <div>{children}</div>
        </div>
    );
}
