import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/api/session-service";
import { calendarHelpers } from "@/lib/actions/calendar-helpers";
import { handleApiError, ApiError } from "@/lib/api/error-handler";

type Params = {
    params: Promise<{ eventId: string }>
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const session = await getAppSession();
        const { eventId } = await params;

        if (!session?.user?.id) {
            throw new ApiError(401, "Non authentifié", "UNAUTHORIZED");
        }

        const body = await req.json();

        // Le body contient les champs Google Calendar (summary, start, end, etc.)
        const updatedEvent = await calendarHelpers.updateEvent(
            session.user.id,
            eventId,
            body
        );

        return NextResponse.json({ success: true, event: updatedEvent });
    } catch (error: unknown) {
        return handleApiError(error, "calendar/events/update");
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await getAppSession();
        const { eventId } = await params;

        if (!session?.user?.id) {
            throw new ApiError(401, "Non authentifié", "UNAUTHORIZED");
        }

        await calendarHelpers.deleteEvent(session.user.id, eventId);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, "calendar/events/delete");
    }
}
