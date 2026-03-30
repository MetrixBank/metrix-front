import React from 'react';
import { ResponsiveContainer, FunnelChart, Funnel, Tooltip, LabelList } from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="p-2 bg-background/80 backdrop-blur-sm border border-border/30 rounded-lg shadow-lg">
        <p className="font-bold text-foreground">{`${data.payload.name}`}</p>
        <p className="text-sm text-muted-foreground">
          {`Quantidade: ${data.value}`}
        </p>
      </div>
    );
  }
  return null;
};

const SalesFunnelChart = ({ data }) => {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Sem dados de atividades para exibir no funil.
      </div>
    );
  }

  const gradients = {
    gradientTotal: ['#8B5CF6', '#6366F1'],
    gradientScheduled: ['#6366F1', '#3B82F6'],
    gradientInProgress: ['#3B82F6', '#2DD4BF'],
    gradientCompletedNoSale: ['#F59E0B', '#FBBF24'],
    gradientSaleMade: ['#22C55E', '#84CC16'],
    gradientCancelled: ['#EF4444', '#F87171'],
    gradientPostponed: ['#A855F7', '#D946EF'],
  };

  // Create a "dummy" dataset for the visual shape of the funnel
  const visualData = data.map((item, index) => ({
    ...item,
    visualValue: 100 - index * 10, // Creates a perfect funnel shape
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="w-full h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <defs>
            {Object.entries(gradients).map(([id, colors]) => (
              <linearGradient id={id} x1="0" y1="0" x2="1" y2="0" key={id}>
                <stop offset="0%" stopColor={colors[0]} stopOpacity={0.9}/>
                <stop offset="100%" stopColor={colors[1]} stopOpacity={1}/>
              </linearGradient>
            ))}
          </defs>
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1, fill: 'transparent' }} />
          <Funnel
            dataKey="visualValue" // Use dummy data for shape
            data={visualData}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
            labelLine={{ stroke: 'rgba(255, 255, 255, 0.5)' }}
            lastShapeType="rectangle"
          >
            <LabelList 
              position="right" 
              fill="#fff" 
              stroke="none" 
              dataKey="name" 
              className="font-semibold"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
            />
             <LabelList 
              position="center" 
              fill="#fff" 
              stroke="none" 
              dataKey="value" // Display the REAL value
              formatter={(value) => (value > 0 ? value : '')}
              className="font-bold text-lg"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
            />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default SalesFunnelChart;