import React, { useEffect, useState } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';

const TutorialOverlay = () => {
  const { isTutorialActive, currentStep, steps, nextStep, endTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const sortedSteps = React.useMemo(() => steps.sort((a, b) => a.step - b.step), [steps]);
  const currentStepConfig = sortedSteps.find(s => s.step === currentStep);

  useEffect(() => {
    if (isTutorialActive && currentStepConfig && currentStepConfig.ref && currentStepConfig.ref.current) {
      const updateRect = () => {
        if (currentStepConfig.ref.current) {
          setTargetRect(currentStepConfig.ref.current.getBoundingClientRect());
          setPopoverOpen(true);
        } else {
          setPopoverOpen(false);
        }
      };

      const observer = new IntersectionObserver(([entry]) => {
        if(entry.isIntersecting) {
            updateRect();
        }
      });
      observer.observe(currentStepConfig.ref.current);
      
      updateRect();
      window.addEventListener('resize', updateRect);

      return () => {
        window.removeEventListener('resize', updateRect);
        if (currentStepConfig.ref.current) {
          observer.unobserve(currentStepConfig.ref.current);
        }
      };
    } else {
      setPopoverOpen(false);
      setTargetRect(null);
    }
  }, [isTutorialActive, currentStep, currentStepConfig]);

  if (!isTutorialActive || (currentStep > 0 && (!currentStepConfig || !targetRect))) {
    return null;
  }
  
  if (currentStep === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background p-8 rounded-lg shadow-2xl max-w-md text-center card-gradient"
        >
          <h2 className="text-2xl font-bold text-gradient mb-4">Bem-vindo à Plataforma GSP! 🚀</h2>
          <p className="text-muted-foreground mb-6">
            Vamos fazer um tour rápido para você começar com tudo. Siga os passos para aprender o básico.
          </p>
          <Button onClick={nextStep}>Vamos começar!</Button>
        </motion.div>
      </div>
    );
  }

  const padding = 10;
  const highlightStyle = {
    position: 'fixed',
    top: `${targetRect.top - padding}px`,
    left: `${targetRect.left - padding}px`,
    width: `${targetRect.width + padding * 2}px`,
    height: `${targetRect.height + padding * 2}px`,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
    borderRadius: '8px',
    zIndex: 100,
    pointerEvents: 'none',
    transition: 'all 0.3s ease-in-out',
  };

  return (
    <AnimatePresence>
      {popoverOpen && (
        <>
          <div style={highlightStyle} />
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <div
                style={{
                  position: 'fixed',
                  top: `${targetRect.top}px`,
                  left: `${targetRect.left}px`,
                  width: `${targetRect.width}px`,
                  height: `${targetRect.height}px`,
                  zIndex: 101,
                }}
              />
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="center"
              className="z-[102] w-80 card-gradient"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-6 w-6 text-primary mt-1" />
                  <p className="text-sm text-foreground">{currentStepConfig.content}</p>
                </div>
                <div className="flex justify-between items-center">
                  <Button variant="ghost" size="sm" onClick={endTutorial} className="text-xs">
                    <X className="w-3 h-3 mr-1" /> Pular Tutorial
                  </Button>
                  <Button onClick={nextStep} size="sm">
                    {currentStepConfig.isLastStep ? 'Concluir' : 'Próximo'}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
    </AnimatePresence>
  );
};

export default TutorialOverlay;