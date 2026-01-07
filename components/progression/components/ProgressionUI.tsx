'use client';

import React from 'react';

/**
 * Composants UI partagés pour le Panel Progression
 * Style Apple/Notion unifié
 */

interface MetricCardProps {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    label: string;
}

/**
 * Grande carte métrique pour les stats principales
 */
export function MetricCard({ icon: Icon, value, label }: MetricCardProps) {
    return (
        <div className="p-5 rounded-xl border border-notion-border bg-notion-bg text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-notion-sidebar flex items-center justify-center">
                <Icon className="w-5 h-5 text-notion-textLight" />
            </div>
            <p className="text-2xl font-semibold text-notion-text tracking-tight">{value}</p>
            <p className="text-xs text-notion-textLight mt-1">{label}</p>
        </div>
    );
}

interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string;
}

/**
 * Carte stat secondaire
 */
export function StatCard({ icon: Icon, title, value }: StatCardProps) {
    return (
        <div className="p-4 rounded-xl border border-notion-border bg-notion-bg">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-notion-sidebar flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-notion-textLight" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-notion-textLight">{title}</p>
                    <p className="text-base font-medium text-notion-text truncate">{value}</p>
                </div>
            </div>
        </div>
    );
}

interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * Card générique pour le contenu
 */
export function Card({ title, children, className = '' }: CardProps) {
    return (
        <div className={`p-5 rounded-xl border border-notion-border bg-notion-bg ${className}`}>
            {title && <p className="text-sm font-medium text-notion-text mb-4">{title}</p>}
            {children}
        </div>
    );
}

interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    sublabel?: string;
}

/**
 * Barre de progression unifiée
 */
export function ProgressBar({ value, max = 100, label, sublabel }: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div>
            {(label || sublabel) && (
                <div className="flex items-center justify-between mb-2">
                    {label && <span className="text-sm font-medium text-notion-text">{label}</span>}
                    {sublabel && <span className="text-sm text-notion-textLight">{sublabel}</span>}
                </div>
            )}
            <div className="h-2 bg-notion-sidebar rounded-full overflow-hidden">
                <div
                    className="h-full bg-notion-blue rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}

/**
 * État vide élégant
 */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
    return (
        <div className="p-8 rounded-xl border border-notion-border bg-notion-bg text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-notion-sidebar flex items-center justify-center">
                <Icon className="w-7 h-7 text-notion-textLight" />
            </div>
            <p className="text-base font-medium text-notion-text mb-2">{title}</p>
            <p className="text-sm text-notion-textLight max-w-xs mx-auto">{description}</p>
        </div>
    );
}

interface ListRowProps {
    icon?: React.ComponentType<{ className?: string }>;
    iconColor?: string;
    title: string;
    subtitle?: string;
    value?: string;
    badge?: string;
    badgeColor?: string;
    rightElement?: React.ReactNode;
}

/**
 * Ligne de liste unifiée
 */
export function ListRow({
    icon: Icon,
    iconColor,
    title,
    subtitle,
    value,
    badge,
    badgeColor = 'text-notion-blue',
    rightElement
}: ListRowProps) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-notion-hover transition-colors">
            {Icon && (
                <div className="w-9 h-9 rounded-lg bg-notion-sidebar flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-notion-textLight" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-notion-text">{title}</p>
                {subtitle && <p className="text-xs text-notion-textLight">{subtitle}</p>}
            </div>
            {badge && <span className={`text-xs font-medium ${badgeColor}`}>{badge}</span>}
            {value && <span className="text-sm font-medium text-notion-text">{value}</span>}
            {rightElement}
        </div>
    );
}
