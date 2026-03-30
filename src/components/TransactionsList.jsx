import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, History, RefreshCw, Eye, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const TransactionsList = ({ 
  transactions, 
  onTransactionClick, 
  onVerifyPaymentStatus, 
  verifyingPaymentId 
}) => {

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendente</Badge>;
      case 'failed':
      case 'cancelled':
        return <Badge className="bg-red-500 hover:bg-red-600">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="card-gradient backdrop-blur-sm shadow-md">
        <CardHeader className="pt-5 pb-3 px-4 sm:px-6">
          <CardTitle className="flex items-center text-lg sm:text-xl text-foreground/90">
            <History className="w-5 h-5 mr-2.5 text-primary" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-4">
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <CreditCard className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground font-medium text-base">Nenhum pagamento encontrado</p>
              <p className="text-sm text-muted-foreground/80 mt-1">
                Clique em "Gerar Novo PIX" para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-400px)] sm:max-h-[calc(100vh-450px)] overflow-y-auto custom-scrollbar pr-1">
              {transactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-background/60 border border-border/50 hover:bg-background/80 hover:shadow-lg transition-all duration-200 gap-3 sm:gap-2"
                >
                  <div 
                    className="flex items-center space-x-3 flex-grow cursor-pointer"
                    onClick={() => onTransactionClick(transaction)}
                  >
                    <div className={`p-2 rounded-full ${transaction.status === 'completed' ? 'bg-primary/10' : transaction.status === 'pending' ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                      <CreditCard className={`w-5 h-5 ${transaction.status === 'completed' ? 'text-primary' : transaction.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{formatCurrency(transaction.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.method === 'pix' ? 'PIX' : 'Pagamento'} - {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-right w-full sm:w-auto justify-end">
                    {transaction.status === 'completed' ? (
                      <p className="text-xs font-medium text-accent whitespace-nowrap">
                        +{(transaction.tokens_earned || 0).toFixed(4)} TOKENS
                      </p>
                    ) : null}
                    {getStatusBadge(transaction.status)}
                    {transaction.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-7"
                        onClick={(e) => {
                          e.stopPropagation(); 
                          onVerifyPaymentStatus(transaction.id, transaction.asaasPaymentId);
                        }}
                        disabled={verifyingPaymentId === transaction.id || verifyingPaymentId === transaction.asaasPaymentId}
                      >
                        {verifyingPaymentId === transaction.id || verifyingPaymentId === transaction.asaasPaymentId ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        Verificar
                      </Button>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => onTransactionClick(transaction)}
                    >
                        <Eye className="w-4 h-4 text-muted-foreground hover:text-accent transition-colors" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TransactionsList;