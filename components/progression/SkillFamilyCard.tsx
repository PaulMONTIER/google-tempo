'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from '@/components/icons';
import type { SkillFamilyData } from '@/lib/gamification/skill-service';
import { SkillDetailsModal } from './SkillDetailsModal';

interface SkillFamilyCardProps {
  skill: SkillFamilyData;
}

export function SkillFamilyCard({ skill }: SkillFamilyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getLevelColor = (level: number) => {
    if (level >= 80) return 'text-green-600 dark:text-green-400';
    if (level >= 60) return 'text-blue-600 dark:text-blue-400';
    if (level >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getLevelBg = (level: number) => {
    if (level >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (level >= 60) return 'bg-blue-100 dark:bg-blue-900/20';
    if (level >= 40) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-gray-100 dark:bg-gray-900/20';
  };

  return (
    <>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-notion-border hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {skill.icon && (
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: `${skill.color}20`,
                  color: skill.color,
                }}
              >
                {/* Icon would be rendered here if we had a dynamic icon component */}
                <div className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-notion-text">{skill.name}</h3>
              <p className="text-sm text-notion-textLight">
                {skill.details.length} compétence{skill.details.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-notion-textLight" />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-notion-textLight">Niveau</span>
            <span className={`text-lg font-bold ${getLevelColor(skill.level)}`}>
              {skill.level}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getLevelBg(skill.level)}`}
              style={{
                width: `${skill.level}%`,
                backgroundColor: skill.color,
                opacity: 0.6,
              }}
            />
          </div>
        </div>

        {skill.xp > 0 && (
          <div className="mt-3 text-sm text-notion-textLight">
            {skill.xp.toLocaleString()} XP
          </div>
        )}
      </div>

      {showDetails && (
        <SkillDetailsModal
          skill={skill}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}


