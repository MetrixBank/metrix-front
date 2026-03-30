import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, User, MapPin, Phone, Briefcase, CalendarDays } from 'lucide-react';
import { formatDate, formatCpfCnpj } from '@/lib/utils';
import { motion } from 'framer-motion';

const CustomerItem = ({ customer, index }) => {
  const formattedDate = customer.created_at ? formatDate(customer.created_at) : 'Data Indisponível';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-3 sm:p-4 border border-border/40 rounded-lg bg-card/30 hover:bg-card/50 transition-colors shadow-sm"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="mb-2 sm:mb-0">
          <p className="font-semibold text-base text-primary flex items-center">
            <User className="w-4 h-4 mr-2"/>{customer.name || 'Nome Indisponível'}
          </p>
          {customer.cpf_cnpj && <p className="text-xs text-muted-foreground">CPF/CNPJ: {formatCpfCnpj(customer.cpf_cnpj)}</p>}
        </div>
        <div className="text-xs text-muted-foreground text-left sm:text-right">
          <p className="flex items-center"><Briefcase size={12} className="mr-1.5"/>Distribuidor: {customer.distributor?.name || 'N/A'}</p>
          <p className="flex items-center"><CalendarDays size={12} className="mr-1.5"/>Cadastrado em: {formattedDate}</p>
        </div>
      </div>
      {(customer.phone || customer.address) && (
        <div className="mt-2 pt-2 border-t border-border/30 text-xs space-y-1">
          {customer.phone && <p className="flex items-center"><Phone size={11} className="mr-1.5 text-primary/70"/>{customer.phone}</p>}
          {customer.address && <p className="flex items-center"><MapPin size={11} className="mr-1.5 text-primary/70"/>{customer.address}</p>}
        </div>
      )}
    </motion.div>
  );
};

const AllCustomersList = ({ customers }) => {
  return (
    <Card className="card-gradient shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl text-gradient flex items-center">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2" /> Lista Geral de Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum cliente encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
            {customers.map((customer, index) => (
              <CustomerItem key={customer.id} customer={customer} index={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AllCustomersList;