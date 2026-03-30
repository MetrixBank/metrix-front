import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, AlertCircle } from 'lucide-react';

const AdminNewUsersChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-primary/50" />
        <p className="text-sm">Sem dados de novos distribuidores para exibir.</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.count), 0);
  const barHeightMultiplier = maxValue > 0 ? 100 / maxValue : 0;

  return (
    <div className="w-full p-2 sm:p-4">
      <div className="flex justify-between items-end h-48 sm:h-64 space-x-1 sm:space-x-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex-1 flex flex-col items-center justify-end h-full">
            <motion.div
              className="w-full bg-gradient-to-b from-purple-500 to-purple-700 rounded-t-md hover:opacity-80 transition-opacity"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${Math.max(item.count * barHeightMultiplier * 0.8, 5)}%`, opacity: 1 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 50 }}
              title={`${item.name}: ${item.count} novo(s)`}
            >
              <div className="text-center text-xs sm:text-sm font-medium text-white opacity-0 hover:opacity-100 transition-opacity duration-300 p-1 truncate">
                 {item.count}
              </div>
            </motion.div>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground truncate">{item.name}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-around mt-2 text-xs text-muted-foreground border-t border-border pt-2">
        {data.length > 0 && <p>Novos distribuidores nos últimos {data.length} meses</p>}
      </div>
    </div>
  );
};

export default AdminNewUsersChart;