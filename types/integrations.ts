export interface EmailMessage {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
    body?: string;
}

export interface DetectedDeadline {
    title: string;
    date: string;
    sourceSubject: string;
    urgency: 'high' | 'medium' | 'low';
    description?: string;
    suggestedResources?: ExternalSource[];
}

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    iconLink?: string;
    modifiedTime?: string;
    size?: string;
}

export interface DriveFileContent {
    id: string;
    name: string;
    mimeType: string;
    content: string;
}

export interface ExerciseItem {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    instruction: string;
    expectedOutput?: string;
}

export interface RevisionSession {
    date: string;
    title: string;
    duration: string;
    description: string;
    type: 'study' | 'exercise' | 'review' | 'practice';
    exercises?: ExerciseItem[];
    start?: string; // ISO string
    end?: string; // ISO string
}

export interface ExternalSource {
    id: string;
    type: 'web' | 'youtube';
    title: string;
    url: string;
    metadata: {
        views?: number;
        subscribers?: number;
        likes?: number;
        duration?: string;
        publishedAt?: string;
        domain?: string;
        author?: string;
    };
    qualityScore: number;
    relevanceReason?: string;
}

export interface QCMItem {
    id: string;
    question: string;
    choices: string[];
    correctIndex: number;
    explanation: string;
    sourceLink?: string;
}

export interface PedagogyPack {
    summary: string;
    exercises: ExerciseItem[];
    qcm: QCMItem[];
    playlist: ExternalSource[];
    confidenceScore: number;
}

export interface RevisionPlan {
    eventTitle: string;
    eventDate: string;
    totalDays: number;
    sessions: RevisionSession[];
    tips: string[];
    summary: string;
    pedagogy?: PedagogyPack; // Optional enrichment
}
