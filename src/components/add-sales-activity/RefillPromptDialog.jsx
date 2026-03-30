import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarClock, Loader2 } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import { useLocalization } from '@/contexts/LocalizationContext';
import { formatDate } from '@/lib/utils';

const RefillPromptDialog = ({ open, onOpenChange, refillData, onConfirm }) => {
  const { region } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);
  const isUSA = region === 'USA';

  if (!refillData) return null;

  const { saleDate, productNames } = refillData;
  const scheduledDate = addMonths(new Date(saleDate), 9);
  const formattedDate = formatDate(scheduledDate, false, region);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm(scheduledDate);
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <AlertDialogContent className="card-gradient border-primary/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg sm:text-xl text-primary">
            <CalendarClock className="h-6 w-6" />
            {isUSA ? 'Schedule Refill Replacement?' : 'Agendar Troca de Refil?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-base">
            <p>
              {isUSA 
                ? `We detected the sale of refillable products (${productNames.join(', ')}).`
                : `Detectamos a venda de produtos refiláveis (${productNames.join(', ')}).`
              }
            </p>
            <p className="font-medium text-foreground">
              {isUSA 
                ? `Would you like to automatically schedule a refill replacement activity for ${formattedDate} (9 months from now)?`
                : `Deseja agendar automaticamente uma atividade de troca de refil para ${formattedDate} (daqui a 9 meses)?`
              }
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className="h-10 text-base">
            {isUSA ? 'No, thanks' : 'Não, obrigado'}
          </AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirm(); }} disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 text-base">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isUSA ? 'Yes, schedule it' : 'Sim, agendar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RefillPromptDialog;