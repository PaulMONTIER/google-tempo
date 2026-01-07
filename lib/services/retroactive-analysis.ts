import { prisma } from '@/lib/prisma';
import { classifyEventsBatch, EventCategory, ClassificationResult } from '@/lib/ai/event-classifier';
import { calculatePoints, calculateTotalPoints, calculateTrophyLevel } from '@/lib/gamification/points-calculator';
import { listCalendarEvents } from '@/lib/calendar';

export interface AnalysisProgress {
  phase: 'fetching' | 'classifying' | 'calculating' | 'saving' | 'completed' | 'error';
  current: number;
  total: number;
  message: string;
}

export interface AnalysisResult {
  success: boolean;
  totalEvents: number;
  totalPoints: number;
  byCategory: Record<EventCategory, { count: number; points: number }>;
  trophyLevel: {
    level: number;
    name: string;
    nextLevelPoints: number;
    progress: number;
  };
  analyzedPeriod: {
    start: Date;
    end: Date;
  };
}

export interface CalendarEventData {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  isRecurring: boolean;
}

/**
 * Service d'analyse rétroactive du calendrier
 * Scanne les 2 derniers mois + mois en cours et attribue des points
 */
export class RetroactiveAnalysisService {
  private userId: string;
  private onProgress?: (progress: AnalysisProgress) => void;

  constructor(userId: string, onProgress?: (progress: AnalysisProgress) => void) {
    this.userId = userId;
    this.onProgress = onProgress;
  }

  private updateProgress(progress: AnalysisProgress) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  /**
   * Lance l'analyse complète
   * IMPORTANT: Cette analyse ne doit se faire qu'UNE SEULE FOIS par utilisateur
   */
  async analyze(): Promise<AnalysisResult> {
    try {
      // Vérification préalable en base (protection supplémentaire)
      const alreadyDone = await hasCompletedRetroactiveAnalysis(this.userId);
      if (alreadyDone) {
        console.log(`[RetroactiveAnalysis] Analyse déjà faite pour ${this.userId}, skip`);
        const existingResults = await getRetroactiveAnalysisResults(this.userId);
        if (existingResults) {
          return existingResults;
        }
      }

      // Phase 1: Récupération des événements
      this.updateProgress({
        phase: 'fetching',
        current: 0,
        total: 100,
        message: 'Récupération de ton calendrier...',
      });

      const events = await this.fetchCalendarEvents();
      
      // IMPORTANT: Même si calendrier vide, on marque l'analyse comme faite
      if (events.length === 0) {
        const emptyResult = this.createEmptyResult();
        await this.markAnalysisAsDone(emptyResult);
        return emptyResult;
      }

      // Phase 2: Classification IA
      this.updateProgress({
        phase: 'classifying',
        current: 0,
        total: events.length,
        message: 'Classification de tes événements...',
      });

      const classifications = await this.classifyEvents(events);

      // Phase 3: Calcul des points
      this.updateProgress({
        phase: 'calculating',
        current: 0,
        total: 100,
        message: 'Calcul de tes points...',
      });

      const pointsData = this.calculateAllPoints(events, classifications);

      // Phase 4: Sauvegarde
      this.updateProgress({
        phase: 'saving',
        current: 0,
        total: 100,
        message: 'Sauvegarde de ta progression...',
      });

      await this.saveResults(pointsData);

      // Terminé
      this.updateProgress({
        phase: 'completed',
        current: 100,
        total: 100,
        message: 'Analyse terminée !',
      });

      return pointsData;
    } catch (error) {
      console.error('Erreur analyse rétroactive:', error);
      this.updateProgress({
        phase: 'error',
        current: 0,
        total: 100,
        message: 'Erreur lors de l\'analyse',
      });
      throw error;
    }
  }

  /**
   * Récupère les événements Google Calendar des 3 derniers mois
   */
  private async fetchCalendarEvents(): Promise<CalendarEventData[]> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1); // Début il y a 3 mois
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Fin du mois courant

    try {
      const googleEvents = await listCalendarEvents(this.userId, {
        startDate,
        endDate,
        maxResults: 500,
      });

      return googleEvents
        .map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description || undefined,
          start: event.startDate,
          end: event.endDate,
          isRecurring: false, // L'API actuelle ne retourne pas cette info
        }))
        .filter((event) => event.start <= now); // Seulement les événements passés
    } catch (error) {
      console.error('Erreur récupération calendrier:', error);
      return [];
    }
  }

  /**
   * Classifie les événements via IA
   */
  private async classifyEvents(
    events: CalendarEventData[]
  ): Promise<Map<string, ClassificationResult>> {
    const eventsForClassification = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.start,
      duration: Math.round((event.end.getTime() - event.start.getTime()) / 60000),
    }));

    return classifyEventsBatch(eventsForClassification);
  }

  /**
   * Calcule les points pour tous les événements
   */
  private calculateAllPoints(
    events: CalendarEventData[],
    classifications: Map<string, ClassificationResult>
  ): AnalysisResult {
    const classifiedEvents = events.map((event) => {
      const classification = classifications.get(event.id) || {
        category: 'unknown' as EventCategory,
        subcategory: null,
        confidence: 0.3,
      };
      const duration = Math.round((event.end.getTime() - event.start.getTime()) / 60000);

      return {
        category: classification.category,
        duration,
        isRecurring: event.isRecurring,
        confidence: classification.confidence,
      };
    });

    const { total, byCategory } = calculateTotalPoints(classifiedEvents);
    const trophyLevel = calculateTrophyLevel(total);

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1); // 3 derniers mois

    return {
      success: true,
      totalEvents: events.length,
      totalPoints: total,
      byCategory,
      trophyLevel,
      analyzedPeriod: {
        start: startDate,
        end: now,
      },
    };
  }

  /**
   * Sauvegarde les résultats dans la base de données
   * Utilise le système XP existant pour la cohérence avec la page progression
   */
  private async saveResults(results: AnalysisResult): Promise<void> {
    try {
      // Importer le service d'XP dynamiquement pour éviter les cycles
      const { addXP, getOrCreateUserProgress } = await import('@/lib/gamification/progress-service');
      const { calculateLevel } = await import('@/lib/gamification/config/level-config');

      // S'assurer que UserProgress existe
      const progress = await getOrCreateUserProgress(this.userId);

      // Vérifier si l'analyse n'a pas déjà été faite (idempotence)
      if (progress.retroactiveAnalysisDone) {
        console.log('Analyse rétroactive déjà effectuée, skip saveResults');
        return;
      }

      // Ajouter les points comme XP (unique fois - analyse rétroactive)
      if (results.totalPoints > 0) {
        await addXP(
          this.userId,
          results.totalPoints,
          'retroactive_analysis',
          `retroactive_${this.userId}`, // ID unique basé sur l'utilisateur
          1.0
        );
      }

      // Mettre à jour les champs spécifiques à l'analyse rétroactive
      await prisma.userProgress.update({
        where: { userId: this.userId },
        data: {
          totalPoints: results.totalPoints,
          currentLevel: calculateLevel(results.totalPoints),
          eventsCompleted: results.totalEvents,
          studiesPoints: results.byCategory.studies.points,
          sportPoints: results.byCategory.sport.points,
          proPoints: results.byCategory.pro.points,
          retroactiveAnalysisDone: true,
          retroactiveAnalysisDate: new Date(),
        },
      });
    } catch (error) {
      console.error('Erreur saveResults:', error);
      throw error;
    }
  }

  /**
   * Retourne un résultat vide si pas d'événements
   */
  private createEmptyResult(): AnalysisResult {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    return {
      success: true,
      totalEvents: 0,
      totalPoints: 0,
      byCategory: {
        studies: { count: 0, points: 0 },
        sport: { count: 0, points: 0 },
        pro: { count: 0, points: 0 },
        personal: { count: 0, points: 0 },
        unknown: { count: 0, points: 0 },
      },
      trophyLevel: {
        level: 1,
        name: 'Débutant',
        nextLevelPoints: 50,
        progress: 0,
      },
      analyzedPeriod: {
        start: startDate,
        end: now,
      },
    };
  }

  /**
   * Marque l'analyse comme faite (même si calendrier vide)
   * CRUCIAL: S'assure que l'analyse ne sera plus jamais relancée
   */
  private async markAnalysisAsDone(results: AnalysisResult): Promise<void> {
    try {
      // S'assurer que UserProgress existe
      await prisma.userProgress.upsert({
        where: { userId: this.userId },
        create: {
          userId: this.userId,
          xp: 0,
          level: 1,
          totalPoints: results.totalPoints,
          currentLevel: 1,
          eventsCompleted: results.totalEvents,
          studiesPoints: results.byCategory.studies.points,
          sportPoints: results.byCategory.sport.points,
          proPoints: results.byCategory.pro.points,
          retroactiveAnalysisDone: true,
          retroactiveAnalysisDate: new Date(),
        },
        update: {
          retroactiveAnalysisDone: true,
          retroactiveAnalysisDate: new Date(),
        },
      });

      console.log(`[RetroactiveAnalysis] ✅ Analyse marquée comme faite pour ${this.userId}`);
    } catch (error) {
      console.error('[RetroactiveAnalysis] Erreur markAnalysisAsDone:', error);
      throw error;
    }
  }
}

/**
 * Vérifie si l'analyse rétroactive a déjà été faite
 */
export async function hasCompletedRetroactiveAnalysis(userId: string): Promise<boolean> {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
    select: { retroactiveAnalysisDone: true },
  });

  return progress?.retroactiveAnalysisDone ?? false;
}

/**
 * Récupère les résultats de l'analyse rétroactive
 */
export async function getRetroactiveAnalysisResults(userId: string): Promise<AnalysisResult | null> {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
  });

  if (!progress || !progress.retroactiveAnalysisDone) {
    return null;
  }

  return {
    success: true,
    totalEvents: progress.eventsCompleted,
    totalPoints: progress.totalPoints,
    byCategory: {
      studies: { count: 0, points: progress.studiesPoints },
      sport: { count: 0, points: progress.sportPoints },
      pro: { count: 0, points: progress.proPoints },
      personal: { count: 0, points: 0 },
      unknown: { count: 0, points: 0 },
    },
    trophyLevel: calculateTrophyLevel(progress.totalPoints),
    analyzedPeriod: {
      start: new Date(progress.retroactiveAnalysisDate?.getTime() || Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: progress.retroactiveAnalysisDate || new Date(),
    },
  };
}

