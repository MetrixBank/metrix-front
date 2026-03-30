import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, CreditCard, User } from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const TransactionItem = ({ transaction, index }) => {
  const statusConfig = getStatusBadge(transaction.status);
  
  return (
    <motion.div
      key={transaction.id}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-background/50 border gap-3 sm:gap-2"
    >
      <div className="flex items-center space-x-3 flex-grow">
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
      
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <div className="text-left sm:text-right">
          <div className="flex items-center justify-end sm:justify-start text-xs text-muted-foreground">
            <User className="w-3 h-3 mr-1" />
            {transaction.distributorName}
          </div>
          {transaction.status === 'completed' && (
            <p className="text-xs font-medium text-accent whitespace-nowrap">
              +{(transaction.tokensEarned || 0).toFixed(4)} TOKENS
            </p>
          )}
        </div>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </div>
    </motion.div>
  );
};

const AllTransactionsList = ({ transactions }) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="card-gradient backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListChecks className="w-5 h-5 mr-2" />
            Todas as Transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[calc(100vh-26rem)] overflow-y-auto pr-2 custom-scrollbar"> {/* Ajuste de altura */}
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <ListChecks className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </div>
            ) : (
              transactions.map((transaction, index) => (
                <TransactionItem key={transaction.id} transaction={transaction} index={index} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AllTransactionsList;