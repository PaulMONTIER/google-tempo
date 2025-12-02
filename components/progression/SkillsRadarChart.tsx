'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { SkillFamilyData } from '@/lib/gamification/skill-service';

interface SkillsRadarChartProps {
  skills: SkillFamilyData[];
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
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">
          Aucune compétence disponible
        </p>
      </div>
    );
  }

  // Couleurs pour chaque compétence
  const colors = skills.map((skill) => skill.color);

  return (
    <div className="w-full h-96 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
            className="text-sm"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Niveau"
            dataKey="level"
            stroke={colors[0] || '#3b82f6'}
            fill={colors[0] || '#3b82f6'}
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            formatter={(value: number) => [`${value}%`, 'Niveau']}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}


