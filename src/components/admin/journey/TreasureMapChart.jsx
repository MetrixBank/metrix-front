import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Flag, TrendingUp, Trophy } from 'lucide-react';

const TreasureMapChart = ({ annualTotal }) => {
  const goal = 1000000;
  const progress = useMemo(() => (annualTotal / goal) * 100, [annualTotal, goal]);
  const formattedAnnualTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualTotal);
  const formattedGoal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal);

  const checkpoints = [
    { name: "Início da Jornada", value: 0, icon: <Flag className="w-5 h-5"/> },
    { name: "Metade do Caminho", value: 50, icon: <TrendingUp className="w-5 h-5"/> },
    { name: "Tesouro à Vista!", value: 100, icon: <Trophy className="w-5 h-5 text-amber-400"/> },
  ];

  return (
    <Card className="bg-gradient-to-br from-blue-900 to-slate-900 text-white shadow-2xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Mapa do Tesouro</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 pb-8 px-6">
        <div className="relative mb-6 h-4">
          <Progress 
            value={progress} 
            className="h-full bg-blue-400/20" 
            indicatorClassName="bg-gradient-to-r from-amber-300 to-yellow-500"
          />
          {checkpoints.map((cp) => (
            <div key={cp.value} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${cp.value}%`, transform: `translateX(-${cp.value}%) translateY(-50%)` }}>
              <div className="relative flex flex-col items-center group">
                <div className="h-4 w-4 bg-white rounded-full border-2 border-blue-400"></div>
                <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {cp.name}
                </div>
              </div>
            </div>
          ))}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ left: '0%' }}
            animate={{ left: `${progress > 100 ? 100 : progress}%` }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{ transform: `translateX(-${progress > 100 ? 100 : progress}%)` }}
          >
            <div className="relative">
              <div className="h-6 w-6 rounded-full bg-yellow-400 border-2 border-white shadow-lg flex items-center justify-center">
                {/* Pode adicionar um ícone aqui se quiser */}
              </div>
            </div>
          </motion.div>
        </div>
        <div className="flex justify-between items-end mt-4">
          <div className="text-left">
            <p className="text-sm text-blue-200">Faturamento Acumulado</p>
            <motion.p 
              key={formattedAnnualTotal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold text-yellow-300"
            >
              {formattedAnnualTotal}
            </motion.p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-300">{progress.toFixed(2)}%</p>
            <p className="text-sm text-blue-200">Completo</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">Meta Final</p>
            <p className="text-2xl font-bold">{formattedGoal}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreasureMapChart;