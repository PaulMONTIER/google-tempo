'use client';

import { useEffect, useState } from 'react';
import { Arena } from '@/lib/gamification/arena-config';
import { X, Trophy, Gift, Sparkles } from 'lucide-react';

interface ArenaUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    newArena: Arena;
    previousArena?: Arena;
}

/**
 * Modal de célébration lors d'une montée d'arène
 * Style propre sans emojis
 */
export function ArenaUpgradeModal({
    isOpen,
    onClose,
    newArena,
    previousArena
}: ArenaUpgradeModalProps) {
    const [showContent, setShowContent] = useState(false);
    const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);

    // Animation d'entrée
    useEffect(() => {
        if (isOpen) {
            // Générer les confettis
            const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
            const newConfetti = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                delay: Math.random() * 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
            }));
            setConfetti(newConfetti);

            // Afficher le contenu avec un léger délai
            const timer = setTimeout(() => setShowContent(true), 100);
            return () => clearTimeout(timer);
        } else {
            setShowContent(false);
            setConfetti([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const modalClasses = [
        'relative z-10 w-full max-w-md mx-4',
        'bg-notion-bg rounded-2xl',
        `border-2 ${newArena.borderColor}`,
        'shadow-2xl overflow-hidden',
        'transition-all duration-500',
        showContent ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
    ].join(' ');

    const headerClasses = [
        'h-32 flex items-center justify-center',
        `bg-gradient-to-br ${newArena.color}`
    ].join(' ');

    const badgeClasses = [
        'inline-block px-6 py-3 rounded-xl mb-4',
        `bg-gradient-to-r ${newArena.color}`
    ].join(' ');

    const rewardClasses = [
        'p-4 rounded-xl mb-6 border',
        newArena.bgColor,
        newArena.borderColor
    ].join(' ');

    const buttonClasses = [
        'w-full py-4 rounded-xl font-bold text-white',
        `bg-gradient-to-r ${newArena.color}`,
        'hover:opacity-90 transition-opacity shadow-lg'
    ].join(' ');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Confettis */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {confetti.map((c) => (
                    <div
                        key={c.id}
                        className="absolute w-3 h-3 rounded-sm"
                        style={{
                            left: `${c.x}%`,
                            backgroundColor: c.color,
                            animation: `confetti-fall 3s ease-out ${c.delay}s forwards`,
                        }}
                    />
                ))}
            </div>

            {/* Modal */}
            <div className={modalClasses}>
                {/* Bouton fermer */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors z-20"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                {/* Header gradient */}
                <div className={headerClasses}>
                    <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Contenu */}
                <div className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-notion-blue" />
                        <h2 className="text-2xl font-bold text-notion-text">
                            Félicitations
                        </h2>
                        <Sparkles className="w-5 h-5 text-notion-blue" />
                    </div>

                    <div className={badgeClasses}>
                        <p className="text-white font-bold text-xl">
                            ARÈNE {newArena.level}
                        </p>
                        <p className="text-white/90 text-lg">
                            {newArena.name.toUpperCase()}
                        </p>
                    </div>

                    <p className="text-notion-text mb-4">
                        Tu as débloqué l&apos;arène <strong>{newArena.name}</strong>
                    </p>

                    {newArena.reward && (
                        <div className={rewardClasses}>
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Gift className="w-4 h-4 text-notion-textLight" />
                                <p className="text-sm text-notion-textLight">Nouvelle récompense</p>
                            </div>
                            <p className="font-semibold text-notion-text">
                                {newArena.reward}
                            </p>
                        </div>
                    )}

                    <button onClick={onClose} className={buttonClasses}>
                        Continuer
                    </button>
                </div>
            </div>
        </div>
    );
}
