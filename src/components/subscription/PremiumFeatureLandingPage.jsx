import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft, Star, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import PremiumUpgradeModal from './PremiumUpgradeModal';

const PremiumFeatureLandingPage = ({ 
  featureName, 
  title, 
  description, 
  benefits = [], 
  imageUrl, 
  ctaText = "Desbloquear Agora" 
}) => {
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white overflow-hidden relative">
      <PremiumUpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="text-slate-300 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 z-10 relative">
        <div className="max-w-xl w-full space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
                    <Star className="w-4 h-4 fill-current" />
                    Recurso Premium
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    {title}
                </h1>
                <p className="text-lg text-slate-300 leading-relaxed mb-8">
                    {description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {benefits.map((benefit, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 * index }}
                            className="flex items-center gap-3"
                        >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="text-slate-200 font-medium">{benefit}</span>
                        </motion.div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button 
                        onClick={() => setShowUpgradeModal(true)}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-lg font-semibold px-8 py-6 rounded-xl shadow-lg shadow-violet-900/20 transition-all hover:scale-105"
                    >
                        <Lock className="w-5 h-5 mr-2" />
                        {ctaText}
                    </Button>
                    <div className="flex flex-col justify-center">
                        <span className="text-sm text-slate-400">Apenas R$ 199/mês</span>
                        <span className="text-xs text-slate-500">Cancele quando quiser</span>
                    </div>
                </div>
            </motion.div>
        </div>
      </div>

      {/* Image Section */}
      <div className="hidden md:flex flex-1 relative bg-black/20">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-slate-950 z-10" />
        <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="w-full h-full"
        >
            <img 
                src={imageUrl} 
                alt={featureName} 
                className="w-full h-full object-cover opacity-80"
            />
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-full h-1/3 bg-gradient-to-t from-slate-950 to-transparent z-10" />
      </div>
    </div>
  );
};

export default PremiumFeatureLandingPage;