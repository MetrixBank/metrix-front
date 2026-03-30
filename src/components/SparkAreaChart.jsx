import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

export function SparkAreaChart({ data, dataKey = "value", color = "emerald-400", height = "100%" }) {
  // Map tailwind color names to hex values for the chart
  const getColorHex = (colorName) => {
    const colors = {
      "emerald-400": "#34d399",
      "cyan-400": "#22d3ee",
      "yellow-400": "#facc15",
      "violet-400": "#a78bfa",
      "red-400": "#f87171",
      "blue-400": "#60a5fa"
    };
    return colors[colorName] || "#34d399";
  };

  const hexColor = getColorHex(color);

  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hexColor} stopOpacity={0.2} />
            <stop offset="100%" stopColor={hexColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip 
          contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '12px' }}
          itemStyle={{ color: '#fff' }}
          cursor={{ stroke: hexColor, strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={hexColor}
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default SparkAreaChart;