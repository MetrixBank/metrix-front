import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, RefreshCw, UserCheck, UserX } from 'lucide-react';

const OpportunityFilters = ({ 
  filters, 
  handleFilterChange, 
  distributors, 
  consultants, 
  fetchData, 
  loading, 
  showCustomerSearch, 
  showActivityStatus,
  showConsultantFilter = false,
  showDistributorTypeFilter = false,
  customStatusOptions,
  customerSearchLabel = "Cliente",
  customerSearchPlaceholder = "Nome/CPF...",
}) => {

  const statusOptions = customStatusOptions || [
    { value: "all", label: "Todos" },
    { value: "scheduled", label: "Agendada" },
    { value: "in_progress", label: "Em Progresso" },
    { value: "visit_made", label: "Concluída (S/ Venda)" },
    { value: "sale_made", label: "Venda Realizada" },
    { value: "postponed", label: "Adiada" },
    { value: "cancelled", label: "Cancelada" },
  ];

  return (
    <Card className="card-gradient shadow-lg border-border/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-md text-gradient flex items-center">
          <Filter className="w-4 h-4 mr-2"/> Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 items-end">
          {showDistributorTypeFilter && (
            <div className="space-y-0.5">
              <Label htmlFor="distributorType" className="text-xs font-medium">Tipo Distribuidor</Label>
              <Select name="distributorType" value={filters.distributorType} onValueChange={(value) => handleFilterChange('distributorType', value)}>
                <SelectTrigger className="bg-background/70 h-7 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team"><div className="flex items-center"><UserCheck className="w-3 h-3 mr-2 text-green-500" />Equipe</div></SelectItem>
                  <SelectItem value="independent"><div className="flex items-center"><UserX className="w-3 h-3 mr-2 text-blue-500" />Externo</div></SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-0.5">
            <Label htmlFor="distributorId" className="text-xs font-medium">Distribuidor / Equipe</Label>
            <Select name="distributorId" value={filters.distributorId} onValueChange={(value) => handleFilterChange('distributorId', value)}>
              <SelectTrigger className="bg-background/70 h-7 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(distributors || []).map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name || d.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-0.5">
            <Label htmlFor="startDate" className="text-xs font-medium">Data Início</Label>
            <Input 
              type="date" 
              id="startDate" 
              name="startDate" 
              value={filters.startDate} 
              onChange={(e) => handleFilterChange('startDate', e.target.value)} 
              className="bg-background/70 h-7 text-xs"
            />
          </div>
          
          <div className="space-y-0.5">
            <Label htmlFor="endDate" className="text-xs font-medium">Data Fim</Label>
            <Input 
              type="date" 
              id="endDate" 
              name="endDate" 
              value={filters.endDate} 
              onChange={(e) => handleFilterChange('endDate', e.target.value)} 
              className="bg-background/70 h-7 text-xs"
            />
          </div>

          {showCustomerSearch && (
            <div className="space-y-0.5">
              <Label htmlFor="customerSearch" className="text-xs font-medium">{customerSearchLabel}</Label>
              <Input 
                type="text" 
                id="customerSearch" 
                name="customerSearch" 
                value={filters.customerSearch} 
                onChange={(e) => handleFilterChange('customerSearch', e.target.value)} 
                className="bg-background/70 h-7 text-xs"
                placeholder={customerSearchPlaceholder}
              />
            </div>
          )}

          {showActivityStatus && (
             <div className="space-y-0.5">
              <Label htmlFor="activityStatus" className="text-xs font-medium">Status</Label>
              <Select name="status" value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="bg-background/70 h-7 text-xs">
                      <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
              </Select>
             </div>
          )}
          
          {showConsultantFilter && (
             <div className="space-y-0.5">
              <Label htmlFor="consultantName" className="text-xs font-medium">Consultor</Label>
              <Select name="consultantName" value={filters.consultantName} onValueChange={(value) => handleFilterChange('consultantName', value)}>
                  <SelectTrigger className="bg-background/70 h-7 text-xs">
                      <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {(consultants || []).map(c => (
                        <SelectItem key={c.id || c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
             </div>
          )}

           <Button 
             onClick={() => fetchData ? fetchData(true) : null} 
             disabled={loading} 
             size="sm"
             className="h-7 px-2 bg-primary hover:bg-primary/90 text-primary-foreground self-end text-xs"
           >
             <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
             {loading ? 'Atualizando...' : 'Aplicar'}
           </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpportunityFilters;