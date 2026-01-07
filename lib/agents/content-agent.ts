import { createGeminiModel } from '@/lib/ai/model-factory';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { youtubeService, VideoMetadata } from '@/lib/services/youtube-service';
import { PedagogyPack, ExternalSource, DriveFileContent } from '@/types/integrations';
import { AGENT_SYSTEM_PROMPT, EXTRACTION_PROMPT, EXTRACTION_SYSTEM_PROMPT } from './prompts';

interface AgentTask {
    courseTag: string;
    documents: DriveFileContent[];
}

export class ContentAgent {
    private model;

    constructor() {
        this.model = createGeminiModel({ temperature: 0.2 });
    }

    /**
     * Generates a full pedagogy pack from documents and external research
     */
    async generatePedagogyPack(task: AgentTask): Promise<PedagogyPack> {
        const totalDocLength = task.documents.reduce((acc, doc) => acc + (doc.content?.length || 0), 0);
        const confidence = this.calculateInitialConfidence(totalDocLength);

        const playlist = confidence < 0.8 ? await this.quickEnrich(task.courseTag) : [];
        return this.generateSynthesis(task, playlist, confidence);
    }

    /**
     * Fast enrichment for a topic (YouTube only)
     */
    async quickEnrich(topic: string, description?: string, accessToken?: string): Promise<ExternalSource[]> {
        let searchTopic = this.cleanTopic(topic);

        if (this.needsRefinement(searchTopic)) {
            searchTopic = await this.refineTopicWithLLM(topic, description) || searchTopic;
        }

        try {
            const videos = await this.searchYouTubeWithVariants(searchTopic, accessToken);
            return this.mapVideosToSources(videos);
        } catch (error) {
            console.error('[ContentAgent] QuickEnrich Error:', error);
            return [];
        }
    }

    // --- Private Helper Methods ---

    private calculateInitialConfidence(length: number): number {
        if (length > 2000) return 0.9;
        if (length > 500) return 0.6;
        return 0.2;
    }

    private cleanTopic(topic: string): string {
        let cleaned = topic.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
        cleaned = cleaned.replace(/^📚\s*/, '');

        const noise = [
            /\b(rattrapage|examen|exam|partiel|ds|interro|interrogation|contrôle|controle)\b/i,
            /\b(cours|td|tp|révision|revision|réviser|reviser)\b/i,
            /\b(synthèse|synthese|préparation|preparation|finale|final|bilan)\b/i,
            /\b(introduction|intro|vue d'ensemble|concepts fondamentaux)\b/i,
            /\b(de|du|d'|le|la|les|au|aux)\b/i
        ];

        noise.forEach(p => cleaned = cleaned.replace(p, ''));
        return cleaned.replace(/\s+/g, ' ').trim() || topic;
    }

    private needsRefinement(topic: string): boolean {
        return topic.length < 3 ||
            topic.split(' ').length > 4 ||
            /^(synthèse|synthese|préparation|preparation|bilan|révision|revision|cours|étude|etude)$/i.test(topic);
    }

    private async refineTopicWithLLM(topic: string, description?: string): Promise<string | null> {
        try {
            const response = await this.model.invoke([
                new SystemMessage(EXTRACTION_SYSTEM_PROMPT),
                new HumanMessage(EXTRACTION_PROMPT(topic, description))
            ]);
            return (response.content as string).trim().replace(/[".]/g, '');
        } catch (e) {
            console.error('[ContentAgent] Refinement failed:', e);
            return null;
        }
    }

    private async searchYouTubeWithVariants(topic: string, accessToken?: string): Promise<VideoMetadata[]> {
        const variants = [
            topic,
            topic.split(':').shift()?.trim() || topic,
            topic.split(' ').slice(0, 2).join(' ')
        ].filter((v, i, a) => v && a.indexOf(v) === i);

        for (const variant of variants) {
            const videos = await youtubeService.searchVideos(`${variant} tutorial`, 5, accessToken);
            if (videos.length > 0) return videos;
        }
        return [];
    }

    private mapVideosToSources(videos: VideoMetadata[]): ExternalSource[] {
        return videos.map(v => ({
            id: v.id,
            type: 'youtube' as const,
            title: v.title,
            url: `https://www.youtube.com/watch?v=${v.id}`,
            metadata: {
                views: v.viewCount,
                author: v.channelTitle,
                duration: v.duration,
                publishedAt: v.publishedAt
            },
            qualityScore: youtubeService.calculateScore(v)
        })).sort((a, b) => b.qualityScore - a.qualityScore).slice(0, 5);
    }

    private async generateSynthesis(task: AgentTask, playlist: ExternalSource[], confidence: number): Promise<PedagogyPack> {
        const prompt = this.buildSynthesisPrompt(task, playlist);

        try {
            const response = await this.model.invoke([
                new SystemMessage(AGENT_SYSTEM_PROMPT),
                new HumanMessage(prompt)
            ]);

            const result = this.parseJSONResponse(response.content as string);

            return {
                ...result,
                playlist,
                confidenceScore: confidence
            };
        } catch (error) {
            console.error('[ContentAgent] Synthesis Error:', error);
            return { summary: "Erreur de génération.", exercises: [], qcm: [], playlist: [], confidenceScore: 0 };
        }
    }

    private buildSynthesisPrompt(task: AgentTask, playlist: ExternalSource[]): string {
        const docContext = task.documents.map(d => `Doc: ${d.name}\n${d.content.substring(0, 2000)}`).join('\n\n');
        const videoContext = playlist.length > 0
            ? `VIDÉOS:\n${playlist.map(v => `- ${v.title} (${v.url})`).join('\n')}`
            : '';
        return `SUJET: ${task.courseTag}\n\nDOCS:\n${docContext}\n\n${videoContext}`;
    }

    private parseJSONResponse(content: string): any {
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    }
}

export const contentAgent = new ContentAgent();
