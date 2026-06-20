import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import type { AIScore } from '../types';

interface HabitabilityChartProps {
  aiScore: AIScore;
}

export default function HabitabilityChart({ aiScore }: HabitabilityChartProps) {
  const { scores } = aiScore;

  const data = [
    { param: 'Sıcaklık', value: scores.temperature_K, fullMark: 100 },
    { param: 'Basınç', value: scores.pressure_kPa, fullMark: 100 },
    { param: 'Gaz', value: scores.toxicGasDensity_kgm3, fullMark: 100 },
    { param: 'Su Hacmi', value: scores.waterVolume_m3, fullMark: 100 },
    { param: 'Su pH', value: scores.waterPH, fullMark: 100 },
    { param: 'Su Sıcaklığı', value: scores.waterTemp_K, fullMark: 100 },
    { param: 'Toprak Nem', value: scores.soilMoisture_kgkg, fullMark: 100 },
    { param: 'Yüzey Yoğun.', value: scores.soilDensity_kgm3, fullMark: 100 },
  ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#334155" strokeWidth={0.5} />
          <PolarAngleAxis
            dataKey="param"
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 8 }}
            stroke="#475569"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '12px',
            }}
            formatter={(value: unknown) => [`${value}%`, 'Uygunluk']}
          />
          <Radar
            name="Yaşam Uygunluğu"
            dataKey="value"
            stroke="#38bdf8"
            fill="#38bdf8"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
