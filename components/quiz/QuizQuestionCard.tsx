'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from '@/components/ui/icons';
import type { QuizQuestionData } from '@/lib/gamification/quiz-service';

interface QuizQuestionCardProps {
  question: QuizQuestionData;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answerIndex: number) => Promise<void>;
  disabled?: boolean;
}

export function QuizQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  disabled = false,
}: QuizQuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(question.userAnswer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(question.userAnswer !== null);

  const handleAnswer = async (answerIndex: number) => {
    if (disabled || isSubmitting || question.userAnswer !== null) {
      return;
    }

    setSelectedAnswer(answerIndex);
    setIsSubmitting(true);

    try {
      await onAnswer(answerIndex);
      setShowExplanation(true);
    } catch (err) {
      console.error('Erreur réponse:', err);
      setSelectedAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOptionStyle = (index: number) => {
    if (question.userAnswer === null) {
      // Question non répondue
      return selectedAnswer === index
        ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-500'
        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400';
    }

    // Question déjà répondue
    if (index === question.correctAnswer) {
      return 'bg-green-100 dark:bg-green-900/20 border-green-500';
    }
    if (index === question.userAnswer && index !== question.correctAnswer) {
      return 'bg-red-100 dark:bg-red-900/20 border-red-500';
    }
    return 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 opacity-60';
  };

  const getOptionIcon = (index: number) => {
    if (question.userAnswer === null) {
      return null;
    }

    if (index === question.correctAnswer) {
      return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    }
    if (index === question.userAnswer && index !== question.correctAnswer) {
      return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Question {questionNumber}/{totalQuestions}
          </span>
        </div>
        {question.userAnswer !== null && (
          <div className="flex items-center gap-1">
            {question.isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
        )}
      </div>

      {/* Question */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        {question.question}
      </h3>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={disabled || isSubmitting || question.userAnswer !== null}
            className={`
              w-full p-4 rounded-lg border-2 transition-all text-left
              ${getOptionStyle(index)}
              ${question.userAnswer === null && !disabled && !isSubmitting
                ? 'cursor-pointer'
                : 'cursor-not-allowed'}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {String.fromCharCode(65 + index)}. {option}
                </span>
              </div>
              {getOptionIcon(index)}
            </div>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {showExplanation && question.explanation && (
        <div
          className={`
            p-4 rounded-lg border
            ${question.isCorrect
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}
          `}
        >
          <div className="flex items-start gap-2">
            <AlertCircle
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                question.isCorrect
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                {question.isCorrect ? 'Correct !' : 'Incorrect'}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {isSubmitting && (
        <div className="mt-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      )}
    </div>
  );
}


