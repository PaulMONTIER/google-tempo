'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
    id: number;
    left: number;
    color: string;
    delay: number;
    duration: number;
}

export function Confetti({ active }: { active: boolean }) {
    const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

    useEffect(() => {
        if (active && !confetti.length) {
            const colors = ['#2383e2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
            const pieces: ConfettiPiece[] = [];

            for (let i = 0; i < 50; i++) {
                pieces.push({
                    id: i,
                    left: Math.random() * 100,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    delay: Math.random() * 2,
                    duration: 2 + Math.random() * 2,
                });
            }

            setConfetti(pieces);
        }
    }, [active, confetti.length]);

    if (!active) return null;

    return (
        <>
            {confetti.map((piece) => (
                <div
                    key={piece.id}
                    className="confetti rounded-sm"
                    style={{
                        left: `${piece.left}%`,
                        backgroundColor: piece.color,
                        animationDelay: `${piece.delay}s`,
                        animationDuration: `${piece.duration}s`,
                    }}
                />
            ))}
        </>
    );
}
