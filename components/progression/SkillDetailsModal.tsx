'use client';

import { X } from '@/components/icons';
import type { SkillFamilyData } from '@/lib/gamification/skill-service';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface SkillDetailsModalProps {
  skill: SkillFamilyData;
  onClose: () => void;
}

export function SkillDetailsModal({ skill, onClose }: SkillDetailsModalProps) {
  const getLevelColor = (level: number) => {
    if (level >= 80) return 'text-green-600 dark:text-green-400';
    if (level >= 60) return 'text-blue-600 dark:text-blue-400';
    if (level >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 transition-opacity"
        style={{
          zIndex: Z_INDEX.modalOverlay,
          transitionDuration: `${DURATIONS.animation}ms`,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: Z_INDEX.modal }}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          style={{
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-notion-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {skill.icon && (
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${skill.color}20`,
                    color: skill.color,
                  }}
                >
                  <div className="w-5 h-5" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-notion-text">{skill.name}</h2>
                <p className="text-sm text-notion-textLight">
                  Niveau global : {skill.level}%
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-notion-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-notion-textLight" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {skill.details.length === 0 ? (
              <p className="text-notion-textLight text-center py-8">
                Aucun détail de compétence disponible
              </p>
            ) : (
              <div className="space-y-4">
                {skill.details.map((detail) => (
                  <div
                    key={detail.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-notion-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-notion-text">{detail.name}</h3>
                      <span className={`text-sm font-semibold ${getLevelColor(detail.level)}`}>
                        {detail.level}%
                      </span>
                    </div>
                    {detail.description && (
                      <p className="text-sm text-notion-textLight mb-3">{detail.description}</p>
                    )}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${detail.level}%`,
                          backgroundColor: skill.color,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    {detail.xp > 0 && (
                      <p className="text-xs text-notion-textLight mt-2">
                        {detail.xp.toLocaleString()} XP
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


