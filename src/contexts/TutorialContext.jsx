import React, { createContext, useState, useContext, useCallback, useEffect, lazy, Suspense } from 'react';

// Lazy load TutorialOverlay to prevent circular dependency
// The overlay component likely uses useTutorial, which creates a cycle if imported statically
const TutorialOverlay = lazy(() => import('@/components/tutorial/TutorialOverlay'));

export const TutorialContext = createContext();

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

export const TutorialProvider = ({ children }) => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [startSignal, setStartSignal] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('tutorialCompleted') === 'true';
  });

  const registerStep = useCallback((step, ref, content, isLastStep = false, onClickAction) => {
    if (step === -1) return; 
    setSteps(prevSteps => {
      const existingStepIndex = prevSteps.findIndex(s => s.step === step);
      const newStep = { step, ref, content, isLastStep, onClickAction };
      
      let updatedSteps;
      if (existingStepIndex !== -1) {
        updatedSteps = [...prevSteps];
        updatedSteps[existingStepIndex] = newStep;
      } else {
        updatedSteps = [...prevSteps, newStep];
      }
      
      return updatedSteps.sort((a, b) => a.step - b.step);
    });
  }, []);
  
  const unregisterStep = useCallback((step) => {
    if (step === -1) return;
    setSteps(prevSteps => prevSteps.filter(s => s.step !== step));
  }, []);

  const startTutorial = useCallback(() => {
    if (isTutorialActive || tutorialCompleted) return;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tutorialCompleted');
      setTutorialCompleted(false);
    }
    setCurrentStep(0);
    setSteps([]);
    setStartSignal(true);
  }, [isTutorialActive, tutorialCompleted]);
  
  useEffect(() => {
    if (startSignal) {
      setIsTutorialActive(true);
      setStartSignal(false);
    }
  }, [startSignal, steps]);

  const endTutorial = useCallback(() => {
    setIsTutorialActive(false);
    setCurrentStep(0);
    setSteps([]);
    if (typeof window !== 'undefined') {
      setTutorialCompleted(true);
      localStorage.setItem('tutorialCompleted', 'true');
    }
  }, []);

  const nextStep = useCallback(() => {
    const sortedSteps = [...steps].sort((a, b) => a.step - b.step);
    const currentStepConfig = sortedSteps.find(s => s.step === currentStep);
    
    if (currentStepConfig?.onClickAction) {
      currentStepConfig.onClickAction();
    }
    
    const currentStepIndex = sortedSteps.findIndex(s => s.step === currentStep);
    
    if (currentStepConfig?.isLastStep || currentStepIndex === -1 || currentStepIndex >= sortedSteps.length - 1) {
      endTutorial();
    } else {
      const nextStepInSequence = sortedSteps[currentStepIndex + 1];
      if (nextStepInSequence) {
        setCurrentStep(nextStepInSequence.step);
      } else {
        endTutorial();
      }
    }
  }, [currentStep, steps, endTutorial]);

  const value = {
    isTutorialActive,
    currentStep,
    registerStep,
    unregisterStep,
    startTutorial,
    nextStep,
    endTutorial,
    steps,
    tutorialCompleted,
    setCurrentStep,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {isTutorialActive && steps.length > 0 && (
        <Suspense fallback={null}>
          <TutorialOverlay />
        </Suspense>
      )}
    </TutorialContext.Provider>
  );
};