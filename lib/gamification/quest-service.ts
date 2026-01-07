import { prisma } from '@/lib/prisma';
import { getUserSkillsFromProfile } from './profile-skills-service';
import { addXP } from './progress-service';
import { endOfDay, endOfWeek } from 'date-fns';

export type QuestType = 'DAILY' | 'WEEKLY';

interface QuestTemplate {
    titleTemplate: string;
    descriptionTemplate: string;
    xpReward: number;
    total: number;
    type: QuestType;
}

const DAILY_TEMPLATES: QuestTemplate[] = [
    {
        titleTemplate: "Session express : {subject}",
        descriptionTemplate: "Compléter une session de travail de 25 min en {subject}",
        xpReward: 50,
        total: 1, // session
        type: 'DAILY'
    },
    {
        titleTemplate: "Focus {subject}",
        descriptionTemplate: "Terminer 2 tâches liées à {subject}",
        xpReward: 75,
        total: 2, // tâches
        type: 'DAILY'
    },
    {
        titleTemplate: "Révision éclair : {subject}",
        descriptionTemplate: "Revoir ses notes de {subject} pendant 15 min",
        xpReward: 40,
        total: 1, // session
        type: 'DAILY'
    }
];

const WEEKLY_TEMPLATES: QuestTemplate[] = [
    {
        titleTemplate: "Maître de {subject}",
        descriptionTemplate: "Accumuler 2h de travail en {subject} cette semaine",
        xpReward: 200,
        total: 120, // minutes
        type: 'WEEKLY'
    },
    {
        titleTemplate: "Marathon {subject}",
        descriptionTemplate: "Compléter 5 sessions de travail en {subject}",
        xpReward: 300,
        total: 5, // sessions
        type: 'WEEKLY'
    },
    {
        titleTemplate: "Expertise : {subject}",
        descriptionTemplate: "Valider 10 tâches en {subject}",
        xpReward: 250,
        total: 10, // tâches
        type: 'WEEKLY'
    }
];

const GENERIC_DAILY: QuestTemplate[] = [
    {
        titleTemplate: "Assiduité",
        descriptionTemplate: "Se connecter à l'application",
        xpReward: 20,
        total: 1,
        type: 'DAILY'
    },
    {
        titleTemplate: "Productivité",
        descriptionTemplate: "Compléter 3 tâches aujourd'hui",
        xpReward: 50,
        total: 3,
        type: 'DAILY'
    }
];

export async function getUserQuests(userId: string) {
    const now = new Date();

    const activeQuests = await prisma.quest.findMany({
        where: {
            userId,
            expiresAt: { gt: now },
            status: { not: 'FAILED' }
        }
    });

    const dailyQuests = activeQuests.filter(q => q.type === 'DAILY');
    const weeklyQuests = activeQuests.filter(q => q.type === 'WEEKLY');

    let newQuests: any[] = [];

    if (dailyQuests.length < 3) {
        const generated = await generateQuests(userId, 'DAILY', 3 - dailyQuests.length);
        newQuests = [...newQuests, ...generated];
    }

    if (weeklyQuests.length < 3) {
        const generated = await generateQuests(userId, 'WEEKLY', 3 - weeklyQuests.length);
        newQuests = [...newQuests, ...generated];
    }

    if (newQuests.length > 0) {
        return [...activeQuests, ...newQuests];
    }

    return activeQuests;
}

async function generateQuests(userId: string, type: QuestType, count: number) {
    const skills = await getUserSkillsFromProfile(userId);
    const generatedQuests = [];
    const now = new Date();

    const expiresAt = type === 'DAILY' ? endOfDay(now) : endOfWeek(now);

    for (let i = 0; i < count; i++) {
        let template: QuestTemplate;
        let skillName = '';
        let skillId = null;

        if (type === 'DAILY' && i === 0 && Math.random() > 0.3) {
            template = GENERIC_DAILY[Math.floor(Math.random() * GENERIC_DAILY.length)];
        } else if (skills.length > 0) {
            const randomSkill = skills[Math.floor(Math.random() * skills.length)];
            const templates = type === 'DAILY' ? DAILY_TEMPLATES : WEEKLY_TEMPLATES;
            template = templates[Math.floor(Math.random() * templates.length)];
            skillName = randomSkill.name;
            skillId = randomSkill.id;
        } else {
            template = GENERIC_DAILY[0];
        }

        const quest = await prisma.quest.create({
            data: {
                userId,
                title: template.titleTemplate.replace('{subject}', skillName),
                description: template.descriptionTemplate.replace('{subject}', skillName),
                xpReward: template.xpReward,
                total: template.total,
                type: template.type,
                skillId: skillId,
                expiresAt
            }
        });
        generatedQuests.push(quest);
    }

    return generatedQuests;
}

/**
 * Met à jour la progression des quêtes basées sur une action ou une compétence détectée
 */
export async function updateQuestProgress(
    userId: string,
    matches: { familyId: string, familyName: string }[],
    durationMinutes: number = 30
) {
    const activeQuests = await prisma.quest.findMany({
        where: {
            userId,
            status: 'PENDING',
            expiresAt: { gt: new Date() }
        }
    });

    for (const quest of activeQuests) {
        let shouldUpdate = false;
        let increment = 0;

        const normalizedQuestTitle = quest.title.toLowerCase();

        // 1. Quêtes génériques
        if (normalizedQuestTitle.includes('productivité')) {
            // Incrémente de 1 à chaque tâche complétée
            shouldUpdate = true;
            increment = 1;
        }
        else if (normalizedQuestTitle.includes('assiduité')) {
            // Devrait être validé au login, mais on peut le valider ici comme fallback
            shouldUpdate = true;
            increment = 1;
        }
        // 2. Quêtes liées aux compétences
        else if (quest.skillId) {
            // Vérifier si un des matches correspond au skillId de la quête
            const matchingSkill = matches.find(m => m.familyId === quest.skillId);

            if (matchingSkill) {
                shouldUpdate = true;

                // Si total > 10, c'est probablement des minutes (ex: 120 min)
                if (quest.total > 10) {
                    increment = durationMinutes;
                } else {
                    // Sinon c'est un compteur d'actions
                    increment = 1;
                }
            }
        }

        if (shouldUpdate) {
            const newProgress = Math.min(quest.total, quest.progress + increment);
            const isCompleted = newProgress >= quest.total;

            // Ne logger que si progrès
            if (newProgress > quest.progress) {
                await prisma.quest.update({
                    where: { id: quest.id },
                    data: {
                        progress: newProgress,
                        status: isCompleted ? 'COMPLETED' : 'PENDING'
                    }
                });

                if (isCompleted) {
                    // Ajouter XP bonus de la quête
                    await addXP(userId, quest.xpReward, 'QUEST_COMPLETION');
                }
            }
        }
    }
}
