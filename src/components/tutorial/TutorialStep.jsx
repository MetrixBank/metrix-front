import React, { useEffect, forwardRef, cloneElement, Children, useRef, useImperativeHandle } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';

function mergeRefs(refs) {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        ref.current = value;
      }
    });
  };
}

const TutorialStep = forwardRef(({ children, step, content, isLastStep = false, onClickAction }, forwardedRef) => {
  const { registerStep, unregisterStep } = useTutorial();
  const internalRef = useRef(null);
  
  useImperativeHandle(forwardedRef, () => internalRef.current);

  useEffect(() => {
    const node = internalRef.current;
    if (node && step !== -1) {
      registerStep(step, { current: node }, content, isLastStep, onClickAction);
    }
    return () => {
      if (step !== -1) {
        unregisterStep(step);
      }
    };
  }, [step, content, registerStep, unregisterStep, isLastStep, onClickAction]);

  if (!React.isValidElement(children)) {
    return children;
  }
  
  const child = Children.only(children);
  
  const childRef = child.ref;
  const ref = mergeRefs([internalRef, childRef, forwardedRef].filter(Boolean));

  return cloneElement(child, { ref });
});

TutorialStep.displayName = 'TutorialStep';

export default TutorialStep;