import React from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import GoalsTab from './GoalsTab';

const GoalsPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="pt-20 container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Metas</h1>
                        <p className="text-muted-foreground mt-2">
                            Defina objetivos pessoais e acompanhe o desempenho da sua equipe em um só lugar.
                        </p>
                    </div>
                </div>
                <GoalsTab />
            </main>
        </div>
    );
};

export default GoalsPage;