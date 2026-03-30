import React from 'react';
import TeamMembersSection from '../TeamMembersSection';

const TeamGenealogyTab = ({ members, loading }) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">Membros da Equipe</h2>
                <p className="text-slate-400">Gerencie sua rede de distribuidores e acompanhe o crescimento da equipe.</p>
            </div>
            <TeamMembersSection members={members} loading={loading} />
        </div>
    );
};

export default TeamGenealogyTab;