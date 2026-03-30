import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { CalendarPlus as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/contexts/LocalizationContext';

export function ConfirmPaymentModal({ open, onOpenChange, onConfirm, entry, loading }) {
  const [paymentDate, setPaymentDate] = useState('');
  const { t } = useLocalization();

  useEffect(() => {
    if (open && entry) {
      // Default to today or entry due date? Usually confirmation means "paid today" or "paid on due date".
      // Let's default to today as it's the action time.
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [open, entry]);

  const handleConfirm = () => {
    if (paymentDate) {
      onConfirm(entry.id, paymentDate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Confirmar Pagamento</DialogTitle>
          <DialogDescription>
            Confirme a data real em que o pagamento foi realizado para o lançamento 
            <span className="font-semibold text-foreground"> "{entry?.description}"</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Data do Pagamento</Label>
            <div className="relative">
                <Input
                    id="date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="pl-10"
                />
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!paymentDate || loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Recebimento/Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}