import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, X, Edit, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, getStatusPortuguese, getActivityTypePortuguese } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import generatePdf from '@/lib/pdfGenerator';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  sale_made: 'bg-green-100 text-green-800',
  completed_no_sale: 'bg-gray-100 text-gray-800',
  rescheduled: 'bg-purple-100 text-purple-800',
  postponed: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
};

const ActivityDetailsModal = ({ activity, isOpen, onClose, onEdit, onDelete }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!activity) return null;

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // The distributor's profile is now part of the activity object itself.
      const distributorProfile = activity.distributor;
      
      if (!distributorProfile) {
        throw new Error("Perfil do distribuidor não carregado para esta atividade.");
      }

      await generatePdf(activity, distributorProfile);

      toast({
        title: "PDF Gerado!",
        description: "O download do seu documento foi iniciado.",
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({
        title: "Erro ao Gerar PDF",
        description: `Houve um problema inesperado: ${error.message}. Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderDetail = (label, value, isBadge = false, badgeClass = '') => (
    <div className="grid grid-cols-3 gap-2 py-2">
      <span className="text-sm font-semibold text-muted-foreground col-span-1">{label}</span>
      <span className="text-sm text-foreground col-span-2">
        {isBadge ? <Badge className={badgeClass}>{value}</Badge> : (value || 'N/A')}
      </span>
    </div>
  );

  const isSale = activity.status === 'sale_made';
  const products = activity.opportunity_products || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gradient flex justify-between items-center">
            Detalhes da Atividade
            <Badge className={`${statusColors[activity.status] || 'bg-gray-200 text-gray-800'}`}>
              {getStatusPortuguese(activity.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            <section>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Informações Gerais</h3>
              {renderDetail('Cliente', activity.customer_name)}
              {renderDetail('Tipo', getActivityTypePortuguese(activity.activity_type))}
              {renderDetail('Data/Hora', formatDate(activity.visit_date, activity.visit_time))}
              {renderDetail('Distribuidor', activity.distributor?.name)}
              {renderDetail('Consultor', activity.consultant_name)}
            </section>
            
            <Separator />

            {isSale && (
              <section>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Detalhes da Venda</h3>
                {renderDetail('Valor da Venda', formatCurrency(activity.sale_value))}
                {renderDetail('Lucro Líquido', formatCurrency(activity.net_profit_calculated))}
                {renderDetail('Comissão', formatCurrency(activity.commission_value))}
                {renderDetail('Outros Custos', formatCurrency(activity.other_costs))}

                <h4 className="text-md font-semibold mt-4 mb-2 text-foreground">Produtos Vendidos</h4>
                {products.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Produto</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Qtd</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Preço Unit.</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map(item => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.product?.name || 'Produto desconhecido'}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{item.quantity_sold}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(item.unit_sale_price_at_sale)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(item.quantity_sold * item.unit_sale_price_at_sale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum produto associado a esta venda.</p>
                )}
              </section>
            )}

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Notas</h3>
              <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-md min-h-[60px]">
                {activity.notes || 'Nenhuma nota adicionada.'}
              </p>
            </section>

          </div>
        </ScrollArea>
        <DialogFooter className="mt-4 gap-2 sm:justify-between">
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(activity)}><Edit className="w-4 h-4 mr-2" />Editar</Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(activity)}><Trash2 className="w-4 h-4 mr-2" />Excluir</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4 mr-2" />Fechar</Button>
            <Button 
              onClick={handleGeneratePdf} 
              disabled={isGeneratingPdf}
              size="sm"
              className="bg-primary/80 hover:bg-primary"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Gerar {isSale ? 'PDF' : 'Orçamento'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailsModal;