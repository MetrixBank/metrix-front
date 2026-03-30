import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Bell, Calendar, User, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import AddSalesActivityModal from '@/components/AddSalesActivityModal';
import { formatDate, getStatusPortuguese } from '@/lib/utils';
import { startOfDay, isBefore } from 'date-fns';

const Notifications = ({ opportunities, user, onActivityUpdate, customers, products }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const pendingActivities = useMemo(() => {
    const today = startOfDay(new Date());
    return (opportunities || [])
      .filter(op => {
        const visitDate = startOfDay(new Date(op.visit_date + 'T00:00:00Z'));
        const isPendingStatus = op.status === 'scheduled' || op.status === 'in_progress';
        const isPastOrToday = isBefore(visitDate, today) || visitDate.getTime() === today.getTime();
        return isPendingStatus && isPastOrToday;
      })
      .sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));
  }, [opportunities]);

  const handleEditClick = (activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedActivity(null);
  };

  const handleActivityUpdated = () => {
    onActivityUpdate();
    handleModalClose();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {pendingActivities.length > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                {pendingActivities.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex justify-between items-center">
            <span>Notificações</span>
            <Badge variant="secondary">{pendingActivities.length} pendentes</Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-[300px]">
            {pendingActivities.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground p-4">
                Nenhuma notificação no momento.
              </div>
            ) : (
              pendingActivities.map(activity => (
                <DropdownMenuItem key={activity.id} className="flex flex-col items-start p-2 cursor-default focus:bg-accent/50">
                  <div className="flex justify-between w-full">
                    <div className="flex-1 mr-2">
                      <p className="font-semibold text-sm text-foreground truncate flex items-center">
                        <User className="w-3 h-3 mr-1.5 text-primary shrink-0" />
                        {activity.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1.5 shrink-0" />
                        {formatDate(activity.visit_date, activity.visit_time)}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); handleEditClick(activity); }}>
                      <Edit className="w-3 h-3 mr-1" />
                      Atualizar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 w-full pl-1">
                    Status: <span className="font-medium">{getStatusPortuguese(activity.status)}</span>
                  </p>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedActivity && (
        <AddSalesActivityModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          user={user}
          onActivityAdded={handleActivityUpdated}
          activityData={selectedActivity}
          customers={customers}
          products={products}
        />
      )}
    </>
  );
};

export default Notifications;