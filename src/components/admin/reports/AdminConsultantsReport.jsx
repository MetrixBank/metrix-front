import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { supabase } from '@/lib/supabaseClient';
    import { toast } from '@/components/ui/use-toast';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import OpportunityFilters from '@/components/admin/overview/OpportunityFilters';
    import { UserCog, Users, Activity as ActivityIcon, DollarSign, Download, FileText, BarChart2 } from 'lucide-react';
    import { formatDate, formatCurrency, getStatusPortuguese } from '@/lib/utils';
    import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';
    import CustomTooltip from '@/components/admin/overview/CustomTooltip';
    import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/exportUtils';

    const ConsultantCard = ({ consultant, index, onShowDetails }) => (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="p-3 sm:p-4 border border-border/40 rounded-lg bg-card/40 hover:bg-card/60 transition-colors shadow-sm"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start">
          <div className="mb-2 sm:mb-0">
            <p className="font-semibold text-base text-primary flex items-center">
              <UserCog className="w-4 h-4 mr-2" />{consultant.name}
            </p>
            <p className="text-xs text-muted-foreground">Atividades: {consultant.activityCount || 0}</p>
            <p className="text-xs text-muted-foreground">Vendas Realizadas: {consultant.salesMadeCount || 0}</p>
          </div>
          <div className="text-xs text-muted-foreground text-left sm:text-right">
            <p className="font-medium text-sm text-green-400">
              Valor Total Vendido: {formatCurrency(consultant.totalSalesValue)}
            </p>
            <p className="text-sm text-orange-400">Comissão Gerada: {formatCurrency(consultant.totalCommissionValue)}</p>
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => onShowDetails(consultant.name)}>
            Ver Atividades
          </Button>
        </div>
      </motion.div>
    );

    const AdminConsultantsReport = ({ distributorType }) => {
      const [allActivities, setAllActivities] = useState([]);
      const [allDistributors, setAllDistributors] = useState([]);
      const [loading, setLoading] = useState(true);
      const [localFilters, setLocalFilters] = useState({
        startDate: '',
        endDate: '',
        distributorId: 'all',
        consultantName: 'all',
      });

      const fetchData = useCallback(async (showToast = true) => {
        setLoading(true);
        if (showToast) {
          toast({ title: 'Buscando dados de consultores...', description: 'Carregando informações.' });
        }
        try {
          const [
            { data: activitiesData, error: activitiesError },
            { data: distributorsData, error: distributorsError },
          ] = await Promise.all([
            supabase.from('sales_opportunities').select('*, distributor:profiles(id, name, email, distributor_type)'),
            supabase.from('profiles').select('id, name, email, distributor_type').eq('role', 'distributor'),
          ]);

          if (activitiesError) throw activitiesError;
          if (distributorsError) throw distributorsError;

          setAllActivities(activitiesData || []);
          setAllDistributors(distributorsData || []);

          if (showToast) {
            toast({ title: 'Dados carregados!', description: 'Informações de consultores atualizadas.' });
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          toast({ title: 'Erro ao buscar dados', description: error.message, variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      }, []);

      useEffect(() => {
        fetchData(false);
      }, [fetchData]);

      const handleFilterChange = (name, value) => {
        setLocalFilters(prev => ({ ...prev, [name]: value }));
      };

      const consultantPerformanceData = useMemo(() => {
        const consultants = {};
        
        const filteredActivities = allActivities.filter(activity => {
            if (!activity.distributor) return false;
            
            if (localFilters.startDate && new Date(activity.visit_date).toISOString().slice(0,10) < localFilters.startDate) return false;
            if (localFilters.endDate && new Date(activity.visit_date).toISOString().slice(0,10) > localFilters.endDate) return false;
            if (localFilters.distributorId !== 'all' && activity.distributor_id !== localFilters.distributorId) return false;
            return true;
        });

        filteredActivities.forEach(activity => {
          if (!activity.consultant_name) return;

          if (!consultants[activity.consultant_name]) {
            consultants[activity.consultant_name] = {
              name: activity.consultant_name,
              activityCount: 0,
              salesMadeCount: 0,
              totalSalesValue: 0,
              totalCommissionValue: 0,
            };
          }
          const c = consultants[activity.consultant_name];
          c.activityCount += 1;
          if (activity.status === 'sale_made') {
            c.salesMadeCount += 1;
            c.totalSalesValue += (activity.sale_value || 0);
            c.totalCommissionValue += (activity.commission_value || 0);
          }
        });
        return Object.values(consultants)
          .filter(c => localFilters.consultantName === 'all' || c.name === localFilters.consultantName)
          .sort((a, b) => b.totalSalesValue - a.totalSalesValue);
      }, [allActivities, localFilters]);

      const allConsultantNames = useMemo(() => 
        Array.from(new Set(allActivities.map(a => a.consultant_name).filter(Boolean)))
        .map(name => ({id: name, name: name})), 
      [allActivities]);

      const handleShowConsultantActivities = (consultantName) => {
        const activities = allActivities.filter(act => act.consultant_name === consultantName);
        console.log(`Activities for ${consultantName}:`, activities);
        toast({
          title: `Atividades de ${consultantName}`,
          description: `${activities.length} atividades encontradas. (Ver console para detalhes)`,
          duration: 5000,
        });
      };
      
       const handleExport = (format) => {
        const dataToExport = consultantPerformanceData.map(c => ({
          'Consultor': c.name,
          'Total de Atividades': c.activityCount,
          'Vendas Realizadas': c.salesMadeCount,
          'Valor Total Vendido': formatCurrency(c.totalSalesValue),
          'Comissão Total Gerada': formatCurrency(c.totalCommissionValue),
        }));
        
        const filename = "relatorio_consultores_mcx";
        if (format === 'csv') exportToCSV(dataToExport, filename);
        if (format === 'excel') exportToExcel(dataToExport, filename, "Consultores");
        if (format === 'pdf') exportToPDF(dataToExport, `Relatório de Consultores MCX (${formatDate(new Date().toISOString())})`, ['Consultor', 'Vendas Realizadas', 'Valor Total Vendido', 'Comissão Total Gerada']);
        
        toast({ title: "Exportação Iniciada", description: `O relatório de consultores será baixado em formato ${format.toUpperCase()}.`});
      };

      const chartData = useMemo(() => consultantPerformanceData.slice(0, 10).map(c => ({
        name: c.name.split(' ')[0], // First name for chart
        Vendas: c.totalSalesValue,
        Comissao: c.totalCommissionValue
      })), [consultantPerformanceData]);

      const distributorsForSelect = useMemo(() => {
          return allDistributors;
      }, [allDistributors]);


      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <OpportunityFilters
            filters={localFilters}
            handleFilterChange={handleFilterChange}
            distributors={distributorsForSelect}
            consultants={allConsultantNames}
            fetchData={() => fetchData(true)}
            loading={loading}
            showCustomerSearch={false}
            showActivityStatus={false}
            showConsultantFilter={true}
            showDistributorTypeFilter={false}
          />

          <Card className="card-gradient shadow-xl">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-xl sm:text-2xl text-gradient flex items-center">
                <UserCog className="w-6 h-6 mr-3" /> Relatório de Consultores ({consultantPerformanceData.length})
              </CardTitle>
               <div className="flex gap-2">
                <Button onClick={() => handleExport('csv')} variant="outline" size="sm" className="text-xs"><Download className="w-3 h-3 mr-1.5"/>CSV</Button>
                <Button onClick={() => handleExport('excel')} variant="outline" size="sm" className="text-xs"><Download className="w-3 h-3 mr-1.5"/>Excel</Button>
                <Button onClick={() => handleExport('pdf')} variant="outline" size="sm" className="text-xs"><FileText className="w-3 h-3 mr-1.5"/>PDF</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && <div className="text-center py-8 text-muted-foreground">Carregando dados dos consultores...</div>}
              {!loading && consultantPerformanceData.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum consultor encontrado com os filtros atuais.</p>
                </div>
              )}
              {!loading && consultantPerformanceData.length > 0 && (
                <>
                  <div className="mb-6 h-[300px] sm:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(value) => formatCurrency(value, 0).replace("R$","")} />
                        <Tooltip content={<CustomTooltip />} formatter={(value) => formatCurrency(value)} cursor={{fill: 'hsl(var(--primary)/0.1)'}}/>
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        <Bar dataKey="Vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Comissao" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 max-h-[calc(100vh-550px)] overflow-y-auto custom-scrollbar pr-2">
                    {consultantPerformanceData.map((consultant, index) => (
                      <ConsultantCard key={consultant.name} consultant={consultant} index={index} onShowDetails={handleShowConsultantActivities} />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      );
    };

    export default AdminConsultantsReport;