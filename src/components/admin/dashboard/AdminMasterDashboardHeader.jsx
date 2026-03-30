import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, RefreshCw, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminMasterDashboardHeader = ({ dateRange, setDateRange, onRefresh, loading }) => {
    
    const handlePresetChange = (value) => {
        const today = new Date();
        switch (value) {
            case '7days':
                setDateRange({ from: subDays(today, 7), to: today });
                break;
            case '30days':
                setDateRange({ from: subDays(today, 30), to: today });
                break;
            case '90days':
                setDateRange({ from: subDays(today, 90), to: today });
                break;
            case 'year':
                 setDateRange({ from: new Date(new Date().getFullYear(), 0, 1), to: today });
                 break;
            case 'all':
                // Passing null signals "all time"
                setDateRange({ from: null, to: null });
                break;
            default:
                break;
        }
    };

    // Helper to display current selection text
    const getDisplayText = () => {
        if (!dateRange || !dateRange.from) return "Todo o período";
        if (dateRange.to) {
            return `${format(dateRange.from, "dd/MM/y", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/y", { locale: ptBR })}`;
        }
        return format(dateRange.from, "dd/MM/y", { locale: ptBR });
    };

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-[#1e293b]/60 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Master</h1>
                <p className="text-slate-400 text-sm mt-1">Visão completa de performance e métricas da plataforma.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {/* Date Presets */}
                <Select onValueChange={handlePresetChange} defaultValue="30days">
                    <SelectTrigger className="w-[180px] bg-slate-800 border-white/10 text-slate-200">
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                        <SelectItem value="7days">Últimos 7 dias</SelectItem>
                        <SelectItem value="30days">Últimos 30 dias</SelectItem>
                        <SelectItem value="90days">Últimos 90 dias</SelectItem>
                        <SelectItem value="year">Este Ano</SelectItem>
                        <SelectItem value="all">Todo o período</SelectItem>
                    </SelectContent>
                </Select>

                {/* Custom Date Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-[240px] justify-start text-left font-normal bg-slate-800 border-white/10 text-slate-200 hover:bg-slate-700 hover:text-white",
                                (!dateRange || !dateRange.from) && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span>{getDisplayText()}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from || new Date()}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            locale={ptBR}
                            className="bg-slate-900 text-slate-200"
                        />
                    </PopoverContent>
                </Popover>

                <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading} className="text-slate-400 hover:text-white hover:bg-white/10">
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
                
                <Button variant="outline" size="icon" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                    <Download className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default AdminMasterDashboardHeader;