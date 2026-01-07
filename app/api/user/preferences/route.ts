import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { syncSkillsWithProfile } from '@/lib/gamification/profile-skills-service';

/**
 * PATCH /api/user/preferences
 * Met à jour partiellement les préférences utilisateur
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();

        // Construire l'objet de mise à jour avec seulement les champs fournis
        const updateData: Record<string, unknown> = {};

        if (data.studySubjects !== undefined) {
            updateData.studySubjects = data.studySubjects;
        }
        if (data.priorityActivities !== undefined) {
            updateData.priorityActivities = data.priorityActivities;
        }
        if (data.sportDiscipline !== undefined) {
            updateData.sportDiscipline = data.sportDiscipline;
        }
        if (data.targetSoftSkills !== undefined) {
            updateData.targetSoftSkills = data.targetSoftSkills;
        }
        if (data.dailyNotificationTime !== undefined) {
            updateData.dailyNotificationTime = data.dailyNotificationTime;
        }
        if (data.messageTone !== undefined) {
            updateData.messageTone = data.messageTone;
        }
        if (data.sportIntegrations !== undefined) {
            updateData.sportIntegrations = data.sportIntegrations;
        }

        // Mettre à jour les préférences
        const updatedPreferences = await prisma.userPreferences.update({
            where: { userId: session.user.id },
            data: updateData,
        });

        // Si les matières ont changé, synchroniser les compétences
        if (data.studySubjects !== undefined) {
            await syncSkillsWithProfile(session.user.id);
        }

        return NextResponse.json({
            success: true,
            preferences: updatedPreferences
        });
    } catch (error) {
        console.error('❌ Erreur API user/preferences PATCH:', error);

        // Si les préférences n'existent pas, les créer
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return NextResponse.json(
                { error: 'Préférences non trouvées. Complétez l\'onboarding d\'abord.' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
