'use client';

import { Award, CheckCircle, XCircle } from '@/components/ui/icons';
import type { QuizData } from '@/lib/gamification/quiz-service';

interface QuizResultsCardProps {
  quiz: QuizData;
  onClose: () => void;
}

export function QuizResultsCard({ quiz, onClose }: QuizResultsCardProps) {
  const score = quiz.score;
  const total = quiz.totalQuestions;
  const percentage = Math.round((score / total) * 100);

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreMessage = () => {
    if (percentage >= 80) return 'Excellent travail ! 🎉';
    if (percentage >= 60) return 'Bien joué ! 👍';
    if (percentage >= 40) return 'Pas mal, continuez ! 💪';
    return 'À améliorer, mais vous progressez ! 📚';
  };

  const correctCount = quiz.questions.filter((q) => q.isCorrect === true).length;
  const incorrectCount = quiz.questions.filter((q) => q.isCorrect === false).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
          <Award className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Quiz terminé !
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">{quiz.eventTitle}</p>
      </div>

      {/* Score */}
      <div className="text-center mb-6">
        <div className={`text-5xl font-bold mb-2 ${getScoreColor()}`}>
          {score}/{total}
        </div>
        <div className={`text-lg font-semibold mb-1 ${getScoreColor()}`}>
          {percentage}%
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{getScoreMessage()}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {correctCount}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Correctes</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {incorrectCount}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Incorrectes</p>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={onClose}
        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
      >
        Fermer
      </button>
    </div>
  );
}


