import React, { useState } from 'react';
import AreaHeader from '@/components/ui/AreaHeader';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import AdminTotalRevenueChart from '@/components/admin/AdminTotalRevenueChart';
import AdminTopDistributorsChart from '@/components/admin/AdminTopDistributorsChart';
import AdminNewUsersChart from '@/components/admin/AdminNewUsersChart';

// Assuming this component replaces or consolidates report views
const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState('revenue');

    const tabs = [
        { id: 'revenue', label: 'Receita', icon: DollarSign },
        { id: 'distributors', label: 'Distribuidores', icon: Users },
        { id: 'growth', label: 'Crescimento', icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen bg-background/50 pb-20">
            <AreaHeader 
                icon={BarChart3}
                title="Relatórios e Análises"
                subtitle="Visão detalhada dos indicadores de desempenho da plataforma."
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
            
            <main className="container mx-auto px-4 sm:px-6 max-w-7xl">
                <div className="bg-card rounded-xl border p-6 shadow-sm">
                    {activeTab === 'revenue' && <AdminTotalRevenueChart />}
                    {activeTab === 'distributors' && <AdminTopDistributorsChart />}
                    {activeTab === 'growth' && <AdminNewUsersChart />}
                </div>
            </main>
        </div>
    );
};

export default ReportsPage;