import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Search, Filter, MapPin, Calendar, Phone } from 'lucide-react';
import { formatCpfCnpj, formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminCustomersTab = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // Newest first

  useEffect(() => {
    fetchCustomers();
  }, [sortOrder]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('customers')
        .select('*, distributor:profiles(name, email)')
        .order('created_at', { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cpf_cnpj?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-end md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Gestão de Clientes (CRM)
          </h2>
          <p className="text-muted-foreground">Visualize e gerencie todos os clientes cadastrados na plataforma.</p>
        </div>
      </div>

      <Card className="card-gradient border-border/30">
        <CardHeader>
           <div className="flex flex-col sm:flex-row gap-4 justify-between">
             <div className="relative w-full sm:w-96">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF ou e-mail..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2">
               <Filter className="h-4 w-4 text-muted-foreground" />
               <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Mais Recentes</SelectItem>
                    <SelectItem value="asc">Mais Antigos</SelectItem>
                  </SelectContent>
               </Select>
             </div>
           </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <Card key={customer.id} className="bg-card/50 hover:bg-card transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        {customer.cpf_cnpj && (
                          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                            {formatCpfCnpj(customer.cpf_cnpj)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center" title="Data de Cadastro">
                         <Calendar className="h-3 w-3 mr-1" />
                         {formatDate(customer.created_at)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      {customer.phone && (
                        <div className="flex items-center text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 mr-2" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center text-muted-foreground truncate" title={customer.address}>
                          <MapPin className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2 mt-2 border-t border-border/30 text-xs flex justify-between items-center">
                       <span className="text-muted-foreground">Distribuidor:</span>
                       <span className="font-medium text-primary">{customer.distributor?.name || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomersTab;