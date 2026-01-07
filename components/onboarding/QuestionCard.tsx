'use client';

import { ReactNode } from 'react';

interface QuestionCardProps {
  children: ReactNode;
}

/**
 * Container stylisé pour chaque question d'onboarding
 */
export function QuestionCard({ children }: QuestionCardProps) {
  return (
    <div className="bg-notion-bg rounded-2xl border border-notion-border shadow-lg p-8">
      {children}
    </div>
  );
}


