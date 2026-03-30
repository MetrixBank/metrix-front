import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, UserCheck, UserPlus } from 'lucide-react';
import { formatPhoneForComparison } from '@/lib/customerDeduplication';

const CustomerDeduplicationWarning = ({ 
  existingCustomer, 
  onUseExisting, 
  onContinueCreation 
}) => {
  if (!existingCustomer) return null;

  return (
    <Alert variant="warning" className="bg-amber-500/10 border-amber-500/30 text-amber-600 mb-4 animate-in slide-in-from-top-2">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-bold flex items-center gap-2">
        Cliente possivelmente duplicado
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="text-sm mb-3">
          Encontramos um cliente existente com dados similares:
        </div>
        
        <div className="bg-background/50 p-3 rounded-md border border-amber-200/20 text-xs space-y-1 mb-4">
          <p><strong>Nome:</strong> {existingCustomer.name}</p>
          {existingCustomer.phone && <p><strong>Telefone:</strong> {existingCustomer.phone}</p>}
          {existingCustomer.email && <p><strong>Email:</strong> {existingCustomer.email}</p>}
          <p className="text-amber-600/70 text-[10px] mt-1">ID: {existingCustomer.id}</p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            className="border-amber-500/30 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800"
            onClick={onContinueCreation}
          >
            <UserPlus className="w-3 h-3 mr-1" /> Criar Novo
          </Button>
          <Button 
            size="sm" 
            className="bg-amber-600 hover:bg-amber-700 text-white border-none"
            onClick={() => onUseExisting(existingCustomer)}
          >
            <UserCheck className="w-3 h-3 mr-1" /> Usar Existente
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default CustomerDeduplicationWarning;