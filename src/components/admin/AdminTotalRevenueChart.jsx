import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const AdminTotalRevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-primary/50" />
        <p className="text-xs">Sem dados de receita para exibir.</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.total), 0);
  const barHeightMultiplier = maxValue > 0 ? 100 / maxValue : 0;

  return (
    <div className="w-full p-2">
      <div className="flex justify-between items-end h-40 space-x-1">
        {data.map((item, index) => (
          <div key={item.name} className="flex-1 flex flex-col items-center justify-end h-full max-w-[60px]">
            <motion.div
              className="w-full bg-gradient-to-b from-primary to-blue-500 rounded-t-sm hover:opacity-80 transition-opacity relative group"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${Math.max(item.total * barHeightMultiplier * 0.75, 3)}%`, opacity: 1 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 50 }}
              title={`${item.name}: ${formatCurrency(item.total)}`}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background/90 text-foreground text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {formatCurrency(item.total)}
              </div>
            </motion.div>
            <p className="mt-1 text-xs text-muted-foreground text-center truncate w-full" title={item.name}>
              {item.name.split(' ')[0]}
            </p>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-2 text-xs text-muted-foreground border-t border-border pt-1">
        <p>Receita dos últimos {data.length} meses</p>
      </div>
    </div>
  );
};

export default AdminTotalRevenueChart;