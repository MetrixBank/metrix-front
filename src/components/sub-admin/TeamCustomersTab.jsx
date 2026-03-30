import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Search, Filter, MapPin, Calendar, Phone, Lock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TeamCustomersTab = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // Newest first by default

  useEffect(() => {
    if (user) {
      fetchTeamCustomers();
    }
  }, [user, sortOrder]);

  const fetchTeamCustomers = async () => {
    setLoading(true);
    try {
      // 1. Get all descendant IDs first (team members)
      const { data: descendants, error: teamError } = await supabase.rpc('get_user_descendants_and_self', {
         p_user_id: user.id
      });
      
      if (teamError) throw teamError;
      
      const teamIds = descendants.map(d => d.id);
      
      // 2. Fetch customers belonging to these distributors
      // Using 'in' filter for distributor_id
      let query = supabase
        .from('customers')
        .select('*, distributor:profiles(name, email)')
        .in('distributor_id', teamIds)
        .order('created_at', { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching team customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.distributor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to mask sensitive data
  const MaskedContent = ({ children, tooltip = "Informação protegida" }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center text-muted-foreground/50 select-none cursor-not-allowed text-xs">
          <Lock className="w-3 h-3 mr-1" />
          {children || "Dados Protegidos"}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-end md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Clientes da Equipe (CRM)
          </h2>
          <p className="text-muted-foreground">Gerencie os clientes cadastrados por você e sua equipe.</p>
        </div>
      </div>

      <Card className="card-gradient border-border/30">
        <CardHeader>
           <div className="flex flex-col sm:flex-row gap-4 justify-between">
             <div className="relative w-full sm:w-96">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente ou distribuidor..."
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
              <p>Nenhum cliente encontrado na sua equipe.</p>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => {
                // Check if the customer belongs to the current sub-admin directly
                const isOwnCustomer = customer.distributor_id === user?.id;

                return (
                  <Card key={customer.id} className="bg-card/50 hover:bg-card transition-colors">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="w-full pr-2">
                          <h3 className="font-semibold text-lg truncate" title={customer.name}>{customer.name}</h3>
                          <div className="mt-1">
                            {isOwnCustomer ? (
                              customer.cpf_cnpj ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                  {customer.cpf_cnpj} 
                                </Badge>
                              ) : null
                            ) : (
                                <MaskedContent>CPF/CNPJ Oculto</MaskedContent>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center flex-shrink-0" title="Data de Cadastro">
                           <Calendar className="h-3 w-3 mr-1" />
                           {formatDate(customer.created_at)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm pt-2">
                        {/* Phone Number Protection */}
                        <div className="flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground flex-shrink-0" />
                          {isOwnCustomer ? (
                            <span className="text-muted-foreground">{customer.phone || 'Sem telefone'}</span>
                          ) : (
                             <MaskedContent tooltip="Telefone visível apenas para o distribuidor responsável">
                               (XX) XXXXX-XXXX
                             </MaskedContent>
                          )}
                        </div>

                        {/* Address Protection */}
                        <div className="flex items-start">
                          <MapPin className="h-3.5 w-3.5 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                          {isOwnCustomer ? (
                            <span className="text-muted-foreground break-words text-sm leading-tight">
                              {customer.address || 'Endereço não informado'}
                            </span>
                          ) : (
                            <MaskedContent tooltip="Endereço visível apenas para o distribuidor responsável">
                              Endereço Oculto
                            </MaskedContent>
                          )}
                        </div>
                      </div>
                      
                      <div className="pt-3 mt-2 border-t border-border/30 text-xs flex justify-between items-center">
                         <span className="text-muted-foreground">Distribuidor Resp.:</span>
                         <span className="font-medium text-primary truncate max-w-[120px]" title={customer.distributor?.name}>
                            {isOwnCustomer ? 'Você' : (customer.distributor?.name || 'Desconhecido')}
                         </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamCustomersTab;