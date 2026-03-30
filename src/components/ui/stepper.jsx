import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const Stepper = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300',
                index === currentStep
                  ? 'bg-primary text-primary-foreground scale-110'
                  : index < currentStep
                  ? 'bg-primary/80 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
            </div>
            <p
              className={cn(
                'mt-2 text-xs text-center transition-colors duration-300',
                index <= currentStep ? 'text-foreground font-semibold' : 'text-muted-foreground'
              )}
            >
              {step.label}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-1 transition-colors duration-500 mx-4',
                index < currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const Step = ({ children }) => {
  return <div>{children}</div>;
};

export { Stepper, Step };