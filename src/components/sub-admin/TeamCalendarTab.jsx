import React, { useState, useEffect } from 'react';
    import { supabase } from '@/lib/supabaseClient';
    import { Loader2 } from 'lucide-react';
    import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
    import { format, parse, startOfWeek, getDay } from 'date-fns';
    import ptBR from 'date-fns/locale/pt-BR';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

    const locales = { 'pt-BR': ptBR };
    const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }), getDay, locales });

    const TeamCalendarTab = ({ subAdminId }) => {
        const [events, setEvents] = useState([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const fetchTeamCalendar = async () => {
                setLoading(true);
                try {
                    const { data: descendants, error: descendantsError } = await supabase.rpc('get_user_descendants_and_self', {
                        p_user_id: subAdminId
                    });
                    if (descendantsError) throw descendantsError;
                    const teamIds = descendants.map(d => d.id);

                    const { data, error } = await supabase
                        .from('sales_opportunities')
                        .select('customer_name, visit_date, visit_time, distributor:profiles(name)')
                        .in('distributor_id', teamIds);
                    
                    if (error) throw error;

                    const calendarEvents = data.map(op => {
                        const startDate = new Date(op.visit_date + 'T' + (op.visit_time || '00:00:00'));
                        return {
                            title: `${op.distributor.name} -> ${op.customer_name}`,
                            start: startDate,
                            end: new Date(startDate.getTime() + 60 * 60 * 1000), // 1 hour duration
                            allDay: !op.visit_time,
                        };
                    });
                    setEvents(calendarEvents);
                } catch (error) {
                    console.error("Error fetching team calendar:", error);
                } finally {
                    setLoading(false);
                }
            };

            if (subAdminId) {
                fetchTeamCalendar();
            }
        }, [subAdminId]);

        if (loading) {
            return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Agenda da Equipe</CardTitle>
                </CardHeader>
                <CardContent style={{ height: '600px' }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        messages={{
                            allDay: 'Dia todo',
                            previous: '<',
                            next: '>',
                            today: 'Hoje',
                            month: 'Mês',
                            week: 'Semana',
                            day: 'Dia',
                            agenda: 'Agenda',
                            date: 'Data',
                            time: 'Hora',
                            event: 'Evento',
                            noEventsInRange: 'Não há eventos neste período.',
                        }}
                        culture="pt-BR"
                    />
                </CardContent>
            </Card>
        );
    };

    export default TeamCalendarTab;