'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { UserSkillData } from '@/lib/gamification/profile-skills-service';

interface SkillsRadarChartProps {
  skills: UserSkillData[];
}

export function SkillsRadarChart({ skills }: SkillsRadarChartProps) {
  // Préparer les données pour le radar chart
  const radarData = skills.map((skill) => ({
    subject: skill.name,
    level: skill.level,
    fullMark: 100,
  }));

  if (radarData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-notion-textLight">
          Aucune compétence disponible
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid
          stroke="var(--notion-border, #e5e5e5)"
          strokeOpacity={0.6}
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fill: 'var(--notion-textLight, #6b7280)',
            fontSize: 11,
            fontWeight: 500
          }}
        />
        <Radar
          name="Niveau"
          dataKey="level"
          stroke="var(--notion-blue, #2383e2)"
          strokeWidth={2}
          fill="var(--notion-blue, #2383e2)"
          fillOpacity={0.15}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--notion-bg, #ffffff)',
            border: '1px solid var(--notion-border, #e5e5e5)',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          formatter={(value: number) => [`${value}%`, 'Niveau']}
          labelStyle={{
            fontWeight: 600,
            marginBottom: '4px',
            color: 'var(--notion-text, #37352f)'
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
