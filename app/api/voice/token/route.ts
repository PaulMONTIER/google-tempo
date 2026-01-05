import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { GoogleGenAI, Modality } from '@google/genai';

const GEMINI_LIVE_MODEL = 'models/gemini-2.5-flash-native-audio-preview-09-2025';

/**
 * Génère un token éphémère pour Gemini Live API
 * Ce token permet au client de se connecter directement à Gemini Live
 * sans exposer la clé API principale
 */
export async function GET() {
    try {
        // Vérifier l'authentification
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        // Vérifier que la clé API est configurée
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Clé API Gemini non configurée' },
                { status: 500 }
            );
        }

        // Créer le client GenAI
        const client = new GoogleGenAI({ apiKey });

        // Calculer l'expiration (30 minutes)
        const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        // Créer le token éphémère avec configuration minimale
        // Les outils seront configurés côté client lors de la connexion
        const token = await client.authTokens.create({
            config: {
                uses: 1,
                expireTime: expireTime,
                liveConnectConstraints: {
                    model: GEMINI_LIVE_MODEL,
                    config: {
                        responseModalities: [Modality.AUDIO],
                        systemInstruction: `Tu es Tempo, un assistant vocal pour la gestion de calendrier. 
Tu parles en français de manière naturelle et concise.
Tu peux consulter, créer et supprimer des événements dans le calendrier de l'utilisateur.
Quand l'utilisateur te demande de créer un événement, confirme toujours les détails avant de le créer.
Sois amical et efficace.`
                    }
                },
                httpOptions: {
                    apiVersion: 'v1alpha'
                }
            }
        });

        console.log('[Voice Token] Token créé avec succès:', {
            tokenName: token.name?.substring(0, 50) + '...',
            expiresAt: expireTime,
            model: GEMINI_LIVE_MODEL
        });

        return NextResponse.json({
            token: token.name,
            expiresAt: expireTime,
            model: GEMINI_LIVE_MODEL
        });

    } catch (error) {
        console.error('[Voice Token] Erreur:', error);

        // Gérer les erreurs spécifiques
        if (error instanceof Error) {
            // Log plus détaillé pour le debug
            console.error('[Voice Token] Message:', error.message);
            console.error('[Voice Token] Stack:', error.stack);

            if (error.message.includes('API key')) {
                return NextResponse.json(
                    { error: 'Clé API invalide' },
                    { status: 401 }
                );
            }
            if (error.message.includes('model') || error.message.includes('not found')) {
                return NextResponse.json(
                    { error: `Modèle ${GEMINI_LIVE_MODEL} non disponible. Vérifiez l'accès à Gemini Live.` },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur lors de la génération du token' },
            { status: 500 }
        );
    }
}
