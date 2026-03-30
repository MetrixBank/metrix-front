import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, FileText, X } from 'lucide-react';
import { NotificationContext } from '@/contexts/NotificationContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const AdminNotifications = () => {
  const { notifications, removeNotification, loading } = useContext(NotificationContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNotificationClick = (notificationId) => {
    navigate('/admin/proposals');
    toast({
      title: "Redirecionando...",
      description: "Você está sendo levado para a tela de gerenciamento de propostas.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <AnimatePresence>
            {notifications.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge variant="destructive" className="h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {notifications.length}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Novas Propostas</span>
          <Badge variant="secondary">{notifications.length} pendentes</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground p-4">Carregando...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-4">
              Nenhuma proposta pendente.
            </div>
          ) : (
            notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start p-2 cursor-pointer focus:bg-accent/50"
                onClick={() => handleNotificationClick(notification.id)}
              >
                <FileText className="w-4 h-4 mr-3 mt-1 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.description}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminNotifications;