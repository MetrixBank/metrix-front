import React, { useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { exportToExcel } from '@/lib/exportUtils';
import { formatCurrency, formatDate, formatCpfCnpj } from '@/lib/utils';

const TEMP_LABEL = {
  Hot: 'Quente',
  Warm: 'Morno',
  Cold: 'Frio',
  'At Risk': 'Em Risco',
};

function buildAddressLine(c) {
  return [
    c.address,
    c.address_number,
    c.address_complement,
    c.address_neighborhood,
    c.address_city,
    c.address_state,
    c.zip_code,
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Exibe um botão de download em Excel quando há clientes na lista (ex.: dados filtrados na tela).
 */
export const ClientExcelExportButton = ({ customers, isUSA = false, sheetName = 'Clientes', filenamePrefix = 'carteira_clientes' }) => {
  const handleExport = useCallback(() => {
    if (!customers?.length) {
      toast({
        title: 'Nada para exportar',
        description: 'Não há clientes na lista atual.',
        variant: 'destructive',
      });
      return;
    }

    const docLabel = isUSA ? 'SSN/EIN' : 'CPF/CNPJ';

    const rows = customers.map((c) => ({
      Nome: c.name || '',
      [docLabel]: c.cpf_cnpj ? formatCpfCnpj(c.cpf_cnpj) : '',
      Telefone: c.phone || '',
      Email: c.email || '',
      Endereço: buildAddressLine(c) || '',
      Temperatura: TEMP_LABEL[c.intelligence?.temperature] || c.intelligence?.temperature || '',
      Score: c.intelligence?.score ?? '',
      'Total comprado': formatCurrency(c.intelligence?.totalPurchased ?? 0),
      'Última venda': c.intelligence?.lastSaleDate ? formatDate(c.intelligence.lastSaleDate) : '',
    }));

    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `${filenamePrefix}_${stamp}.xlsx`;
    exportToExcel(rows, filename, sheetName);
    toast({
      title: 'Download iniciado',
      description: `Arquivo ${filename} será salvo em Excel.`,
    });
  }, [customers, isUSA, sheetName, filenamePrefix]);

  if (!customers?.length) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 shrink-0 border-border/50 bg-background/70 text-xs hover:bg-secondary/80"
      onClick={handleExport}
    >
      <Download className="mr-1.5 h-3.5 w-3.5" />
      Excel
    </Button>
  );
};
