
import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface TrustGaugeProps {
  score: number;
}

export const TrustGauge: React.FC<TrustGaugeProps> = ({ score }) => {
  const getColor = (value: number) => {
    if (value < 50) return '#f43f5e'; // rose-500
    if (value < 75) return '#facc15'; // yellow-400
    return '#10b981'; // emerald-500
  };

  const color = getColor(score);
  const data = [{ name: 'score', value: score, fill: color }];
  
  const riskLevel = score < 50 ? "HIGH RISK" : score < 75 ? "MEDIUM RISK" : "LOW RISK";

  return (
    <div className="w-full h-48 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={180}
          endAngle={0}
          barSize={20}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold" style={{ color }}>
          {score}
        </span>
        <span className="text-sm font-semibold tracking-wider opacity-80" style={{color}}>
          {riskLevel}
        </span>
      </div>
    </div>
  );
};
