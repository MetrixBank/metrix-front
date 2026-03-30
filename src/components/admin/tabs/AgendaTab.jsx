import React from 'react';
import AdminActivitiesCalendar from '@/components/admin/calendar/AdminActivitiesCalendar';

const AgendaTab = () => {
    // This wrapper allows us to easily inject specific props or toggle between different calendar views (e.g. team vs external) if needed in future
    return (
        <div className="h-full">
            <AdminActivitiesCalendar distributorType="all" />
        </div>
    );
};

export default AgendaTab;