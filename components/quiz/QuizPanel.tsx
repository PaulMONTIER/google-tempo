'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { useQuiz } from '@/hooks/use-quiz';
import { QuizQuestionCard } from './QuizQuestionCard';
import { QuizResultsCard } from './QuizResultsCard';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface QuizPanelProps {
  isOpen: boolean;
  onClose: () => void;
  quizId?: string;
  eventId?: string;
  eventTitle?: string;
  onQuizCreated?: () => void;
}

export function QuizPanel({
  isOpen,
  onClose,
  quizId,
  eventId,
  eventTitle,
  onQuizCreated,
}: QuizPanelProps) {
  const {
    quiz,
    currentQuestion,
    currentQuestionIndex,
    progress,
    allQuestionsAnswered,
    isLoading,
    error,
    createQuiz,
    loadQuiz,
    answerQuestion,
    completeQuiz,
    setCurrentQuestionIndex,
    reset,
  } = useQuiz();

  const [isVisible, setIsVisible] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      if (quizId) {
        loadQuiz(quizId).catch((err) => console.error('Erreur chargement quiz:', err));
      } else if (eventId && eventTitle) {
        // Créer un nouveau quiz si eventId fourni
        createQuiz(eventId, eventTitle)
          .then(() => {
            if (onQuizCreated) {
              onQuizCreated();
            }
          })
          .catch((err) => console.error('Erreur création quiz:', err));
      }
    } else {
      setIsVisible(false);
      reset();
    }
  }, [isOpen, quizId, eventId, eventTitle, loadQuiz, createQuiz, reset, onQuizCreated]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      reset();
      onClose();
    }, DURATIONS.animation);
  };

  const handleAnswer = async (answerIndex: number) => {
    if (!currentQuestion) return;
    await answerQuestion(currentQuestion.id, answerIndex);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await completeQuiz();
      if (onQuizCreated) {
        onQuizCreated();
      }
    } catch (err) {
      console.error('Erreur complétion quiz:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity`}
        style={{
          zIndex: Z_INDEX.modalOverlay,
          transitionDuration: `${DURATIONS.animation}ms`,
          opacity: isVisible ? 1 : 0,
        }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-0 flex items-center justify-center p-4 transition-all ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{
          zIndex: Z_INDEX.modal,
          transitionDuration: `${DURATIONS.animation}ms`,
        }}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          style={{
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Questionnaire de validation
              </h2>
              {quiz && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {quiz.eventTitle}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading && !quiz ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {quizId ? 'Chargement du quiz...' : 'Génération du quiz...'}
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Fermer
                </button>
              </div>
            ) : quiz && quiz.completed ? (
              <QuizResultsCard quiz={quiz} onClose={handleClose} />
            ) : quiz && currentQuestion ? (
              <>
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progression
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Question */}
                <QuizQuestionCard
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={quiz.questions.length}
                  onAnswer={handleAnswer}
                  disabled={isCompleting}
                />

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </button>

                  {allQuestionsAnswered && !quiz.completed ? (
                    <button
                      onClick={handleComplete}
                      disabled={isCompleting}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCompleting ? 'Finalisation...' : 'Terminer le quiz'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={currentQuestionIndex >= quiz.questions.length - 1}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-600 dark:text-gray-400">
                  Aucun quiz disponible
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

