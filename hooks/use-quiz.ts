import { useState, useCallback } from 'react';
import type { QuizData, QuizQuestionData } from '@/lib/gamification/quiz-service';

export interface QuizProposal {
  shouldPropose: boolean;
  reason?: string;
  eventId?: string;
  eventTitle?: string;
}

export function useQuiz() {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<QuizProposal | null>(null);

  /**
   * Vérifie si un quiz doit être proposé pour un événement
   */
  const checkProposal = useCallback(async (eventId: string, eventTitle: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/gamification/quizzes?eventId=${eventId}&eventTitle=${encodeURIComponent(eventTitle)}`
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification de la proposition');
      }

      const data = await response.json();

      if (data.success && data.data?.proposal) {
        setProposal(data.data.proposal);
        return data.data.proposal;
      } else {
        throw new Error(data.error || 'Données invalides');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      console.error('Erreur checkProposal:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crée un nouveau quiz
   */
  const createQuiz = useCallback(
    async (
      eventId: string,
      eventTitle: string,
      eventDescription?: string,
      goalEventId?: string,
      seriesId?: string,
      documentation?: string
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/gamification/quizzes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId,
            eventTitle,
            eventDescription,
            goalEventId,
            seriesId,
            documentation,
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la création du quiz');
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Convertir les dates
          const quizData = {
            ...data.data,
            completedAt: data.data.completedAt ? new Date(data.data.completedAt) : null,
            createdAt: new Date(data.data.createdAt),
            questions: data.data.questions.map((q: any) => ({
              ...q,
              answeredAt: q.answeredAt ? new Date(q.answeredAt) : null,
            })),
          };
          setQuiz(quizData);
          setCurrentQuestionIndex(0);
          return quizData;
        } else {
          throw new Error(data.error || 'Données invalides');
        }
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
        console.error('Erreur createQuiz:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Charge un quiz existant
   */
  const loadQuiz = useCallback(async (quizId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gamification/quizzes?quizId=${quizId}`);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du quiz');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Convertir les dates
        const quizData = {
          ...data.data,
          completedAt: data.data.completedAt ? new Date(data.data.completedAt) : null,
          createdAt: new Date(data.data.createdAt),
          questions: data.data.questions.map((q: any) => ({
            ...q,
            answeredAt: q.answeredAt ? new Date(q.answeredAt) : null,
          })),
        };
        setQuiz(quizData);
        // Trouver la première question non répondue
        const firstUnanswered = quizData.questions.findIndex((q: any) => q.userAnswer === null);
        setCurrentQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : quizData.questions.length - 1);
        return quizData;
      } else {
        throw new Error(data.error || 'Données invalides');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      console.error('Erreur loadQuiz:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Répond à une question
   */
  const answerQuestion = useCallback(
    async (questionId: string, answerIndex: number) => {
      if (!quiz) {
        throw new Error('Aucun quiz chargé');
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/gamification/quizzes/${quiz.id}/answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId,
            answerIndex,
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la réponse');
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Mettre à jour la question dans le quiz local
          setQuiz((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              questions: prev.questions.map((q) =>
                q.id === questionId
                  ? {
                    ...q,
                    userAnswer: answerIndex,
                    isCorrect: data.data.isCorrect,
                    explanation: data.data.explanation,
                    answeredAt: new Date(),
                  }
                  : q
              ),
            };
          });

          // Passer à la question suivante si disponible
          const currentIndex = quiz.questions.findIndex((q) => q.id === questionId);
          if (currentIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentIndex + 1);
          }

          return data.data;
        } else {
          throw new Error(data.error || 'Données invalides');
        }
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
        console.error('Erreur answerQuestion:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [quiz]
  );

  /**
   * Finalise le quiz
   */
  const completeQuiz = useCallback(async () => {
    if (!quiz) {
      throw new Error('Aucun quiz chargé');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gamification/quizzes/${quiz.id}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la finalisation');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Convertir les dates
        const quizData = {
          ...data.data,
          completedAt: data.data.completedAt ? new Date(data.data.completedAt) : null,
          createdAt: new Date(data.data.createdAt),
          questions: data.data.questions.map((q: any) => ({
            ...q,
            answeredAt: q.answeredAt ? new Date(q.answeredAt) : null,
          })),
        };
        setQuiz(quizData);
        return quizData;
      } else {
        throw new Error(data.error || 'Données invalides');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      console.error('Erreur completeQuiz:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [quiz]);

  /**
   * Réinitialise le hook
   */
  const reset = useCallback(() => {
    setQuiz(null);
    setCurrentQuestionIndex(0);
    setProposal(null);
    setError(null);
  }, []);

  const currentQuestion: QuizQuestionData | null =
    quiz && quiz.questions[currentQuestionIndex] ? quiz.questions[currentQuestionIndex] : null;

  const progress = quiz
    ? Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)
    : 0;

  const allQuestionsAnswered = quiz
    ? quiz.questions.every((q) => q.userAnswer !== null)
    : false;

  return {
    quiz,
    currentQuestion,
    currentQuestionIndex,
    progress,
    allQuestionsAnswered,
    proposal,
    isLoading,
    error,
    checkProposal,
    createQuiz,
    loadQuiz,
    answerQuestion,
    completeQuiz,
    setCurrentQuestionIndex,
    reset,
  };
}


