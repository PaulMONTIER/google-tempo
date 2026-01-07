import { google, youtube_v3 } from 'googleapis';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

export interface VideoMetadata {
    id: string;
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    duration: string; // ISO 8601 duration
    thumbnailUrl: string;
    channelSubscribers?: number;
}

export class YouTubeService {
    private youtube: youtube_v3.Youtube;

    constructor() {
        this.youtube = google.youtube({
            version: 'v3',
            auth: YOUTUBE_API_KEY
        });
    }

    /**
     * Search for videos and return scored candidates
     */
    async searchVideos(query: string, maxResults: number = 5, accessToken?: string): Promise<VideoMetadata[]> {
        const auth = accessToken || YOUTUBE_API_KEY;

        if (!auth) {
            console.warn('[YouTubeService] No auth provided');
            return [];
        }

        try {
            const searchParams: youtube_v3.Params$Resource$Search$List = {
                part: ['snippet'],
                q: query,
                type: ['video'],
                maxResults: maxResults,
                ...(accessToken ? { access_token: accessToken } : {})
            };

            const searchRes = await this.youtube.search.list(searchParams);
            const items = searchRes.data.items || [];

            const videoIds = items.map(item => item.id?.videoId).filter(Boolean) as string[];
            if (videoIds.length === 0) return [];

            const videosRes = await this.youtube.videos.list({
                part: ['snippet', 'contentDetails', 'statistics'],
                id: videoIds,
                ...(accessToken ? { access_token: accessToken } : {})
            });

            return (videosRes.data.items || []).map(item => this.mapToMetadata(item));

        } catch (error) {
            console.error('[YouTubeService] Search Error:', error);
            return [];
        }
    }

    /**
     * Maps a YouTube API item to our internal VideoMetadata interface
     */
    private mapToMetadata(item: youtube_v3.Schema$Video): VideoMetadata {
        const stats = item.statistics;
        const snippet = item.snippet;

        return {
            id: item.id || '',
            title: snippet?.title || '',
            description: snippet?.description || '',
            channelTitle: snippet?.channelTitle || '',
            publishedAt: snippet?.publishedAt || '',
            viewCount: parseInt(stats?.viewCount || '0'),
            likeCount: parseInt(stats?.likeCount || '0'),
            commentCount: parseInt(stats?.commentCount || '0'),
            duration: item.contentDetails?.duration || '',
            thumbnailUrl: snippet?.thumbnails?.high?.url || '',
        };
    }

    /**
     * Calculate a quality score for a video
     */
    calculateScore(video: VideoMetadata): number {
        // 1. Popularity (Log scale)
        const popularityScore = Math.min(Math.log10(video.viewCount + 1) / 7, 1);

        // 2. Engagement (Likes/Views)
        const engagementRatio = video.viewCount > 0 ? (video.likeCount / video.viewCount) : 0;
        const engagementScore = Math.min(engagementRatio * 20, 1);

        // 3. Freshness
        const publishDate = new Date(video.publishedAt);
        const yearsOld = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        const freshnessScore = Math.max(0, 1 - (yearsOld / 5));

        return (popularityScore * 0.4) + (engagementScore * 0.4) + (freshnessScore * 0.2);
    }
}

export const youtubeService = new YouTubeService();
