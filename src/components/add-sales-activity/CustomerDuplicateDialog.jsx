import React from 'react';
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
import { User, Phone, MapPin } from 'lucide-react';

const CustomerDuplicateDialog = ({ isOpen, onOpenChange, existingCustomer, onConfirmUseExisting, onCancel }) => {
  if (!existingCustomer) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#161922] border-white/10 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-amber-400 flex items-center gap-2">
            Cliente Já Existente
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">
            Encontramos um cliente cadastrado com dados similares. Deseja vincular esta venda ao cliente existente?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-white/5 p-4 rounded-lg border border-white/10 my-2">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold">
                    {existingCustomer.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <h4 className="font-bold text-white">{existingCustomer.name}</h4>
                    <p className="text-xs text-white/50">Cadastrado em: {new Date(existingCustomer.created_at).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="space-y-1 text-sm text-white/60">
                {existingCustomer.phone && (
                    <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" /> {existingCustomer.phone}
                    </div>
                )}
                {existingCustomer.address && (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> {existingCustomer.address}
                    </div>
                )}
            </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} className="border-white/10 text-white hover:bg-white/10 hover:text-white">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirmUseExisting(existingCustomer)} className="bg-violet-600 hover:bg-violet-700 text-white">
            Usar Existente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CustomerDuplicateDialog;