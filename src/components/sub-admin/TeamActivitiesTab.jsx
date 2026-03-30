import React, { useMemo, useState } from 'react';
import TeamActivitiesSection from './TeamActivitiesSection';
import TeamKanbanView from './TeamKanbanView';
import { LayoutList, KanbanSquare } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const TeamActivitiesTab = ({ activities, distributors, loading, dateFilter }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'

    // Apply shared date filter before passing to section
    const filteredActivities = useMemo(() => {
        let filtered = [...activities];
        if (dateFilter.startDate) {
            const start = new Date(dateFilter.startDate);
            filtered = filtered.filter(a => new Date(a.visit_date) >= start);
        }
        if (dateFilter.endDate) {
            const end = new Date(dateFilter.endDate);
            filtered = filtered.filter(a => new Date(a.visit_date) <= end);
        }
        return filtered;
    }, [activities, dateFilter]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Atividades da Equipe</h2>
                    <p className="text-slate-400">
                        Monitore as vendas, visitas e prospecções realizadas pelo seu time em tempo real.
                    </p>
                    {dateFilter.preset !== 'all' && (
                        <p className="text-xs text-emerald-400 font-medium mt-1">
                            Filtrando por: {dateFilter.label} ({filteredActivities.length} atividades)
                        </p>
                    )}
                </div>

                <div className="bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)}>
                        <ToggleGroupItem value="list" aria-label="Lista" className="data-[state=on]:bg-slate-700 data-[state=on]:text-emerald-400">
                            <LayoutList className="h-4 w-4 mr-2" />
                            Lista
                        </ToggleGroupItem>
                        <ToggleGroupItem value="kanban" aria-label="Kanban" className="data-[state=on]:bg-slate-700 data-[state=on]:text-emerald-400">
                            <KanbanSquare className="h-4 w-4 mr-2" />
                            Kanban
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            {viewMode === 'list' ? (
                <TeamActivitiesSection 
                    activities={filteredActivities} 
                    distributors={distributors} 
                    loading={loading} 
                />
            ) : (
                <TeamKanbanView
                    activities={activities} // Kanban handles filtering internally or we pass filtered. Let's pass filtered to be safe, but TeamKanbanView also has filter logic. 
                    // Actually, let's pass RAW activities to Kanban if it filters inside, OR pass filtered.
                    // The Kanban component I wrote takes `dateFilter` prop and re-filters.
                    // To be consistent with standard props, passing RAW activities and the filter object is better for drag-drop optimistics.
                    distributors={distributors}
                    loading={loading}
                    dateFilter={dateFilter}
                />
            )}
        </div>
    );
};

export default TeamActivitiesTab;