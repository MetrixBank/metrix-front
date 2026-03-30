import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StatusManager from './StatusManager';

const StatusManagerButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsOpen(true)}
              className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 border-slate-800 text-slate-200">
            <p>Gerenciar Status</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <StatusManager isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default StatusManagerButton;