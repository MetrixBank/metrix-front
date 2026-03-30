import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CalendarClock, User, Briefcase, DollarSign, ShoppingBag, Eye } from 'lucide-react';
import { formatDate, formatCurrency, getStatusPortuguese, formatCpfCnpj, getActivityTypePortuguese } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const ActivityItem = ({ activity, index, products, onShowDetails }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="p-3 sm:p-4 border border-border/40 rounded-lg bg-card/30 hover:bg-card/50 transition-colors shadow-sm"
  >
    <div className="flex flex-col sm:flex-row justify-between items-start">
      <div className="mb-2 sm:mb-0 flex-grow">
        <p className="font-semibold text-base text-primary flex items-center">
          <User className="w-4 h-4 mr-2" />{activity.customer_name || 'Atividade Interna'}
        </p>
        <p className="text-xs text-muted-foreground flex items-center">
          <CalendarClock size={12} className="mr-1.5"/>{formatDate(activity.visit_date, activity.visit_time)}
        </p>
        <p className="text-xs text-muted-foreground flex items-center">
          <Briefcase size={12} className="mr-1.5"/>Distribuidor: {activity.distributor?.name || 'N/A'}
        </p>
      </div>
      <div className="text-xs text-muted-foreground text-left sm:text-right">
        <p className={`font-medium text-sm ${activity.status === 'sale_made' ? 'text-green-400' : activity.status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'}`}>
          Status: {getStatusPortuguese(activity.status)}
        </p>
        {activity.activity_type && <p>Tipo: {getActivityTypePortuguese(activity.activity_type)}</p>}
      </div>
    </div>
    {(activity.status === 'sale_made' || activity.opportunity_products?.length > 0) && (
      <div className="mt-2 pt-2 border-t border-border/30 text-xs space-y-1">
        {activity.status === 'sale_made' && activity.sale_value != null && (
          <p className="flex items-center font-medium"><DollarSign size={11} className="mr-1.5 text-green-400"/>Valor da Venda: {formatCurrency(activity.sale_value)}</p>
        )}
      </div>
    )}
    <div className="mt-2 flex justify-end">
      <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => onShowDetails(activity)}>
        <Eye className="w-3 h-3 mr-1"/> Ver Detalhes
      </Button>
    </div>
  </motion.div>
);

const AllActivitiesList = ({ activities, products }) => {

  const handleShowDetails = (activity) => {
    let productDetailsText = "Nenhum produto associado.";
    if (activity.opportunity_products && activity.opportunity_products.length > 0) {
      productDetailsText = activity.opportunity_products.map(op => {
        const productInfo = products.find(p => p.id === op.product_id); 
        const productName = productInfo ? productInfo.name : 'Produto Desconhecido';
        return `${productName} (Qtd: ${op.quantity_sold}, Custo Unit.: ${formatCurrency(op.unit_cost_price_at_sale)}, Venda Unit.: ${formatCurrency(op.unit_sale_price_at_sale)})`;
      }).join("; ");
    }

    toast({
      title: `Detalhes da Atividade: ${activity.customer_name || 'Atividade Interna'}`,
      description: (
        <div className="text-2xs sm:text-xs max-h-40 sm:max-h-48 overflow-y-auto custom-scrollbar">
          <p>Data e Hora: {formatDate(activity.visit_date, activity.visit_time)}</p>
          <p>Distribuidor: {activity.distributor?.name || 'N/A'}</p>
          <p>Consultor: {activity.consultant_name || 'N/A'}</p>
          <p>Status: {getStatusPortuguese(activity.status)}</p>
          <p>Tipo: {getActivityTypePortuguese(activity.activity_type)}</p>
          {activity.status === 'sale_made' && activity.sale_value != null && <p>Valor Total da Venda: {formatCurrency(activity.sale_value)}</p>}
          {activity.commission_value != null && <p>Comissão: {formatCurrency(activity.commission_value)}</p>}
          {activity.other_costs != null && <p>Outros Custos: {formatCurrency(activity.other_costs)}</p>}
          {activity.customer_cpf_cnpj && <p>CPF/CNPJ Cliente: {formatCpfCnpj(activity.customer_cpf_cnpj)}</p>}
          {activity.customer_phone && <p>Telefone Cliente: {activity.customer_phone}</p>}
          {activity.customer_address && <p>Endereço Cliente: {activity.customer_address}</p>}
          <p>Produtos: {productDetailsText}</p>
          {activity.notes && <p>Notas: {activity.notes}</p>}
        </div>
      ),
      duration: 15000 
    });
  };


  return (
    <Card className="card-gradient shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl text-gradient flex items-center">
          <Activity className="w-5 h-5 sm:w-6 sm:h-6 mr-2" /> Lista Geral de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma atividade encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
            {activities.map((activity, index) => (
              <ActivityItem key={activity.id} activity={activity} index={index} products={products} onShowDetails={handleShowDetails} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AllActivitiesList;