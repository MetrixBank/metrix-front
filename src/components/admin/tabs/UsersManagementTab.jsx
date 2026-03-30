import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const UsersManagementTab = () => {
    return (
        <Card className="bg-[#1e293b]/50 border-white/10">
            <CardHeader>
                <CardTitle className="text-white">Gestão de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-slate-400 text-center py-10">Módulo de Usuários em desenvolvimento.</div>
            </CardContent>
        </Card>
    );
};
export default UsersManagementTab;