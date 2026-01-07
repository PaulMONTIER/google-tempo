import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

/**
 * Familles de compétences prédéfinies pour un étudiant
 */
const SKILL_FAMILIES = [
    {
        name: 'Sciences',
        color: '#3b82f6', // Blue
        icon: 'Flask',
        order: 1,
        keywords: ['math', 'maths', 'mathématiques', 'physique', 'chimie', 'svt', 'biologie', 'science', 'sciences', 'calcul', 'algèbre', 'géométrie', 'statistiques', 'probabilités'],
        details: [
            { name: 'Mathématiques', keywords: ['math', 'maths', 'mathématiques', 'calcul', 'algèbre', 'géométrie', 'équation', 'fonction', 'dérivée', 'intégrale', 'statistiques', 'probabilités'] },
            { name: 'Physique', keywords: ['physique', 'mécanique', 'électricité', 'optique', 'thermodynamique', 'ondes'] },
            { name: 'Chimie', keywords: ['chimie', 'molécule', 'atome', 'réaction', 'acide', 'base', 'organique'] },
            { name: 'SVT', keywords: ['svt', 'biologie', 'géologie', 'écologie', 'cellule', 'génétique', 'évolution'] },
        ],
    },
    {
        name: 'Langues',
        color: '#10b981', // Green
        icon: 'Languages',
        order: 2,
        keywords: ['français', 'anglais', 'espagnol', 'allemand', 'langue', 'langues', 'vocabulaire', 'grammaire', 'conjugaison', 'expression', 'compréhension'],
        details: [
            { name: 'Français', keywords: ['français', 'littérature', 'dissertation', 'commentaire', 'grammaire', 'conjugaison', 'orthographe', 'rédaction'] },
            { name: 'Anglais', keywords: ['anglais', 'english', 'toeic', 'toefl', 'vocabulary', 'grammar'] },
            { name: 'Espagnol', keywords: ['espagnol', 'spanish', 'español'] },
            { name: 'Allemand', keywords: ['allemand', 'german', 'deutsch'] },
        ],
    },
    {
        name: 'Communication',
        color: '#f59e0b', // Amber
        icon: 'MessageSquare',
        order: 3,
        keywords: ['présentation', 'oral', 'exposé', 'rédaction', 'écriture', 'argumentation', 'débat', 'communication', 'discours', 'pitch'],
        details: [
            { name: 'Présentation orale', keywords: ['présentation', 'oral', 'exposé', 'soutenance', 'pitch', 'discours'] },
            { name: 'Rédaction', keywords: ['rédaction', 'écriture', 'dissertation', 'rapport', 'synthèse', 'mémoire'] },
            { name: 'Argumentation', keywords: ['argumentation', 'débat', 'rhétorique', 'persuasion', 'négociation'] },
        ],
    },
    {
        name: 'Organisation',
        color: '#8b5cf6', // Violet
        icon: 'Calendar',
        order: 4,
        keywords: ['planification', 'organisation', 'planning', 'révision', 'révisions', 'préparation', 'agenda', 'gestion', 'temps', 'notes', 'fiche'],
        details: [
            { name: 'Planification', keywords: ['planification', 'planning', 'organisation', 'agenda', 'calendrier', 'préparation'] },
            { name: 'Gestion du temps', keywords: ['temps', 'pomodoro', 'productivité', 'efficacité', 'deadline'] },
            { name: 'Prise de notes', keywords: ['notes', 'fiche', 'fiches', 'résumé', 'synthèse', 'mindmap'] },
        ],
    },
    {
        name: 'Numérique',
        color: '#ec4899', // Pink
        icon: 'Code',
        order: 5,
        keywords: ['programmation', 'code', 'coding', 'informatique', 'développement', 'web', 'python', 'javascript', 'excel', 'bureautique', 'word', 'powerpoint'],
        details: [
            { name: 'Programmation', keywords: ['programmation', 'code', 'coding', 'python', 'javascript', 'java', 'c++', 'développement', 'algorithme'] },
            { name: 'Bureautique', keywords: ['excel', 'word', 'powerpoint', 'slides', 'tableur', 'traitement de texte', 'bureautique'] },
            { name: 'Recherche web', keywords: ['recherche', 'google', 'documentation', 'veille', 'sources'] },
        ],
    },
];

/**
 * Seed les familles de compétences dans la base de données
 */
export async function seedSkillFamilies(): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const family of SKILL_FAMILIES) {
        // Upsert de la famille
        const existingFamily = await prisma.skillFamily.findUnique({
            where: { name: family.name },
        });

        let familyRecord;

        if (existingFamily) {
            familyRecord = await prisma.skillFamily.update({
                where: { id: existingFamily.id },
                data: {
                    color: family.color,
                    icon: family.icon,
                    order: family.order,
                    keywords: JSON.stringify(family.keywords),
                    isActive: true,
                    autoDetect: true,
                },
            });
            updated++;
        } else {
            familyRecord = await prisma.skillFamily.create({
                data: {
                    name: family.name,
                    color: family.color,
                    icon: family.icon,
                    order: family.order,
                    keywords: JSON.stringify(family.keywords),
                    isActive: true,
                    autoDetect: true,
                },
            });
            created++;
        }

        // Upsert des détails
        for (const detail of family.details) {
            const existingDetail = await prisma.skillDetail.findFirst({
                where: {
                    familyId: familyRecord.id,
                    name: detail.name,
                },
            });

            if (existingDetail) {
                await prisma.skillDetail.update({
                    where: { id: existingDetail.id },
                    data: {
                        keywords: JSON.stringify(detail.keywords),
                    },
                });
            } else {
                await prisma.skillDetail.create({
                    data: {
                        familyId: familyRecord.id,
                        name: detail.name,
                        keywords: JSON.stringify(detail.keywords),
                    },
                });
            }
        }
    }

    logger.info(`[seed-skills] Seed terminé: ${created} créées, ${updated} mises à jour`);

    return { created, updated };
}

/**
 * Supprime toutes les familles de compétences (pour reset)
 */
export async function clearSkillFamilies(): Promise<number> {
    const result = await prisma.skillFamily.deleteMany({});
    logger.info(`[seed-skills] ${result.count} familles supprimées`);
    return result.count;
}
