import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getUserQuests } from '@/lib/gamification/quest-service';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const quests = await getUserQuests(session.user.id);
        return NextResponse.json(quests);
    } catch (error) {
        console.error('Error fetching quests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
