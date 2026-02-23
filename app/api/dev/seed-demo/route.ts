import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { addDays, subDays } from 'date-fns';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { userProgress: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const body = await req.json().catch(() => ({}));
        const action = body.action || 'seed';

        if (action === 'clear') {
            // Nettoyer les données MOCK
            await prisma.quest.deleteMany({ where: { userId: user.id, title: { contains: '(MOCK)' } } });
            await prisma.preparationTree.deleteMany({ where: { userId: user.id, goalTitle: { contains: '(MOCK)' } } });

            if (user.userProgress) {
                await prisma.userProgress.update({
                    where: { id: user.userProgress.id },
                    data: { xp: 0, level: 1, totalPoints: 0, currentLevel: 1, currentStreak: 0, longestStreak: 0 }
                });
            }

            await prisma.userSkillProgress.deleteMany({ where: { userId: user.id } });

            return NextResponse.json({ success: true, message: 'Données de simulation supprimées.' });
        }


        // --- 1. Gamification (UserProgress & XP History) ---
        let userProgress = user.userProgress;
        if (!userProgress) {
            userProgress = await prisma.userProgress.create({
                data: {
                    userId: user.id,
                    xp: 12450,
                    level: 14,
                    totalPoints: 12450,
                    currentLevel: 14,
                    currentStreak: 24,
                    longestStreak: 45,
                    totalActions: 342,
                    totalTasksCreated: 150,
                    totalTasksCompleted: 132,
                    quizzes: { create: [] }
                }
            });
        } else {
            userProgress = await prisma.userProgress.update({
                where: { id: userProgress.id },
                data: {
                    xp: 12450, level: 14, totalPoints: 12450, currentLevel: 14,
                    currentStreak: 24, longestStreak: 45, totalActions: 342,
                    totalTasksCreated: 150, totalTasksCompleted: 132
                }
            });
        }

        // Generate XP History (last 30 days fake activity)
        await prisma.xpHistory.deleteMany({ where: { userProgressId: userProgress.id } });
        const historyData = [];
        for (let i = 0; i < 60; i++) {
            historyData.push({
                userProgressId: userProgress.id,
                amount: Math.floor(Math.random() * 50) + 10,
                actionType: ['task_completed', 'quiz_completed', 'event_attended'][Math.floor(Math.random() * 3)],
                createdAt: subDays(new Date(), Math.floor(Math.random() * 30)),
            });
        }
        await prisma.xpHistory.createMany({ data: historyData });

        // --- 2. Skills & Radar Chart Data ---
        const skillsData = [
            { family: 'Études', color: '#10b981', skills: [{ n: 'Dev Web', xp: 4500, l: 85 }, { n: 'Algorithmique', xp: 2100, l: 65 }, { n: 'Data Science', xp: 1200, l: 45 }, { n: 'Maths', xp: 900, l: 35 }] },
            { family: 'Pro', color: '#3b82f6', skills: [{ n: 'Gestion de projet', xp: 3200, l: 75 }, { n: 'Communication', xp: 1500, l: 50 }, { n: 'Management', xp: 600, l: 25 }] },
            { family: 'Santé', color: '#f43f5e', skills: [{ n: 'Course à pied', xp: 2800, l: 70 }, { n: 'Musculation', xp: 1800, l: 55 }, { n: 'Sommeil', xp: 4000, l: 90 }] },
            { family: 'Perso', color: '#8b5cf6', skills: [{ n: 'Lecture', xp: 1900, l: 60 }, { n: 'Guitare', xp: 800, l: 30 }, { n: 'Cuisine', xp: 1100, l: 40 }] }
        ];

        for (const [vOrder, group] of skillsData.entries()) {
            let family = await prisma.skillFamily.findFirst({ where: { name: group.family } });
            if (!family) {
                family = await prisma.skillFamily.create({ data: { name: group.family, color: group.color, order: vOrder, keywords: '[]' } });
            }
            for (const skill of group.skills) {
                let detail = await prisma.skillDetail.findFirst({ where: { name: skill.n, familyId: family.id } });
                if (!detail) detail = await prisma.skillDetail.create({ data: { name: skill.n, familyId: family.id, keywords: '[]' } });

                const progress = await prisma.userSkillProgress.findUnique({
                    where: { userId_skillFamilyId_skillDetailId: { userId: user.id, skillFamilyId: family.id, skillDetailId: detail.id } }
                });
                if (progress) {
                    await prisma.userSkillProgress.update({ where: { id: progress.id }, data: { xp: skill.xp, level: skill.l, lastActivityAt: subDays(new Date(), Math.floor(Math.random() * 5)) } });
                } else {
                    await prisma.userSkillProgress.create({ data: { userId: user.id, skillFamilyId: family.id, skillDetailId: detail.id, xp: skill.xp, level: skill.l, lastActivityAt: subDays(new Date(), Math.floor(Math.random() * 5)) } });
                }
            }
        }

        // --- 3. Quests ---
        await prisma.quest.deleteMany({ where: { userId: user.id, title: { contains: '(MOCK)' } } });
        await prisma.quest.createMany({
            data: [
                { userId: user.id, title: "Sprint React (MOCK)", description: "Termine 3 modules du cours React", xpReward: 150, progress: 2, total: 3, type: "DAILY", status: "PENDING", skillId: "Dev Web", expiresAt: addDays(new Date(), 1) },
                { userId: user.id, title: "Semi-Marathon Training (MOCK)", description: "Cours 30km cette semaine", xpReward: 300, progress: 12, total: 30, type: "WEEKLY", status: "PENDING", skillId: "Course à pied", expiresAt: addDays(new Date(), 5) },
                { userId: user.id, title: "Deep Work (MOCK)", description: "Fais 4 sessions de Deep Work", xpReward: 100, progress: 4, total: 4, type: "DAILY", status: "COMPLETED", expiresAt: new Date() },
                { userId: user.id, title: "Liseur fou (MOCK)", description: "Lis 50 pages", xpReward: 50, progress: 15, total: 50, type: "DAILY", status: "PENDING", skillId: "Lecture", expiresAt: addDays(new Date(), 1) },
                { userId: user.id, title: "Projet Fin d'Études (MOCK)", description: "Avance de 20% sur le rapport", xpReward: 500, progress: 5, total: 20, type: "WEEKLY", status: "PENDING", skillId: "Gestion de projet", expiresAt: addDays(new Date(), 4) },
            ]
        });

        // --- 4. Arbres de préparation ---
        await prisma.preparationTree.deleteMany({ where: { goalTitle: { contains: '(MOCK)' } } });

        // Arbre 1: Passé (Terminé)
        const pastGoalDate = subDays(new Date(), 5);
        await prisma.preparationTree.create({
            data: {
                userId: user.id, treeId: `mock_tree_past_${Date.now()}`, goalEventId: `mock_goal_past_${Date.now()}`,
                goalTitle: "Certification AWS (MOCK - Terminé)", goalDate: pastGoalDate, detectionMethod: "manual",
                branches: {
                    create: [
                        { branchEventId: `mock_bp_1_${Date.now()}`, branchTitle: "Module Cloud Practitioner", branchDate: subDays(pastGoalDate, 20), order: 0 },
                        { branchEventId: `mock_bp_2_${Date.now()}`, branchTitle: "Whitepapers EC2 & S3", branchDate: subDays(pastGoalDate, 15), order: 1 },
                        { branchEventId: `mock_bp_3_${Date.now()}`, branchTitle: "Examens Blancs x3", branchDate: subDays(pastGoalDate, 5), order: 2 },
                        { branchEventId: `mock_bp_4_${Date.now()}`, branchTitle: "Révision des erreurs", branchDate: subDays(pastGoalDate, 2), order: 3 },
                    ]
                }
            }
        });

        // Arbre 2: En cours (Urgent)
        const urgentGoalDate = addDays(new Date(), 3);
        await prisma.preparationTree.create({
            data: {
                userId: user.id, treeId: `mock_tree_urgent_${Date.now()}`, goalEventId: `mock_goal_urgent_${Date.now()}`,
                goalTitle: "Hackathon IA (MOCK - Urgent)", goalDate: urgentGoalDate, detectionMethod: "ai",
                branches: {
                    create: [
                        { branchEventId: `mock_bu_1_${Date.now()}`, branchTitle: "Brainstorming & Pitch", branchDate: subDays(urgentGoalDate, 10), order: 0 },
                        { branchEventId: `mock_bu_2_${Date.now()}`, branchTitle: "Setup Architecture", branchDate: subDays(urgentGoalDate, 7), order: 1 },
                        { branchEventId: `mock_bu_3_${Date.now()}`, branchTitle: "Développement MVP", branchDate: new Date(), order: 2 },
                        { branchEventId: `mock_bu_4_${Date.now()}`, branchTitle: "Préparation Démo", branchDate: addDays(new Date(), 2), order: 3 },
                    ]
                }
            }
        });

        // Arbre 3: Futur lointain
        const farGoalDate = addDays(new Date(), 45);
        await prisma.preparationTree.create({
            data: {
                userId: user.id, treeId: `mock_tree_far_${Date.now()}`, goalEventId: `mock_goal_far_${Date.now()}`,
                goalTitle: "Marathon de Paris (MOCK - Futur)", goalDate: farGoalDate, detectionMethod: "manual",
                branches: {
                    create: [
                        { branchEventId: `mock_bf_1_${Date.now()}`, branchTitle: "Semaine 1: Sortie Longue", branchDate: addDays(new Date(), 5), order: 0 },
                        { branchEventId: `mock_bf_2_${Date.now()}`, branchTitle: "Semaine 2: Fractionné", branchDate: addDays(new Date(), 12), order: 1 },
                        { branchEventId: `mock_bf_3_${Date.now()}`, branchTitle: "Semaine 3: Récupération", branchDate: addDays(new Date(), 19), order: 2 },
                        { branchEventId: `mock_bf_4_${Date.now()}`, branchTitle: "Semaine 4: Simulation Course", branchDate: addDays(new Date(), 26), order: 3 },
                        { branchEventId: `mock_bf_5_${Date.now()}`, branchTitle: "Tapering (Repos)", branchDate: addDays(new Date(), 35), order: 4 },
                    ]
                }
            }
        });

        // --- 5. Données Strava Automatiques ---

        const marathonStravaDate = addDays(new Date(), 45);
        await prisma.preparationTree.deleteMany({ where: { goalTitle: { contains: '(Strava MOCK)' } } });
        await prisma.preparationTree.create({
            data: {
                userId: user.id, treeId: `strava_mock_tree_${Date.now()}`, goalEventId: `strava_mock_goal_${Date.now()}`,
                goalTitle: "Schneider Electric Marathon de Paris (Strava MOCK)", goalDate: marathonStravaDate, detectionMethod: "manual",
                branches: {
                    create: [
                        { branchEventId: `strava_mock_b1_${Date.now()}`, branchTitle: "🏃 Sortie Longue 15km", branchDate: subDays(new Date(), 3), order: 0 },
                        { branchEventId: `strava_mock_b2_${Date.now()}`, branchTitle: "🏃 Fractionné 10x400m", branchDate: subDays(new Date(), 1), order: 1 },
                        { branchEventId: `strava_mock_b3_${Date.now()}`, branchTitle: "🏃 Footing Récup 8km", branchDate: addDays(new Date(), 2), order: 2 },
                        { branchEventId: `strava_mock_b4_${Date.now()}`, branchTitle: "🏃 Sortie Longue 20km", branchDate: addDays(new Date(), 5), order: 3 },
                        { branchEventId: `strava_mock_b5_${Date.now()}`, branchTitle: "🏃 Fractionné 4x1000m", branchDate: addDays(new Date(), 8), order: 4 },
                        { branchEventId: `strava_mock_b6_${Date.now()}`, branchTitle: "🏃 Semi-Marathon Prep", branchDate: addDays(new Date(), 12), order: 5 },
                    ]
                }
            }
        });


        return NextResponse.json({ success: true, message: 'Données de simulation injectées avec succès.' });

    } catch (error) {
        console.error('Erreur seed demo data:', error);
        return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
    }
}
