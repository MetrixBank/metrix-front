import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, User, FileText, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AdminCalendarEventDetails = ({ event, isOpen, onClose, onDelete, onEdit }) => {
    if (!event) return null;

    const isFinancial = event.type === 'financial';
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <div className={`mt-1 p-2 rounded-full ${isFinancial ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {isFinancial ? <FileText className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold leading-tight">
                                {event.title}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 mt-1">
                                {isFinancial ? 'Lançamento Financeiro' : 'Atividade de Venda'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Time & Date */}
                    <div className="flex items-center gap-3 text-sm">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-200">
                            {format(event.start, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                            {!event.allDay && ` • ${format(event.start, "HH:mm")} - ${format(event.end, "HH:mm")}`}
                        </span>
                    </div>

                    {/* Assigned To (Activities Only) */}
                    {!isFinancial && event.resource?.distributor && (
                        <div className="flex items-center gap-3 text-sm">
                            <User className="w-4 h-4 text-slate-500" />
                            <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                    <AvatarImage src={event.resource.distributor.avatar_url} />
                                    <AvatarFallback className="text-[10px]">{event.resource.distributor.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-slate-200">{event.resource.distributor.name}</span>
                            </div>
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`
                            ${event.status === 'sale_made' || event.status === 'paid' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 
                              event.status === 'cancelled' ? 'border-red-500 text-red-400 bg-red-500/10' :
                              event.status === 'in_progress' ? 'border-blue-500 text-blue-400 bg-blue-500/10' :
                              'border-slate-500 text-slate-400 bg-slate-500/10'}
                        `}>
                            {event.status === 'sale_made' ? 'Venda Realizada' :
                             event.status === 'paid' ? 'Pago' :
                             event.status === 'in_progress' ? 'Em Progresso' :
                             event.status === 'scheduled' ? 'Agendado' :
                             event.status}
                        </Badge>
                        {!isFinancial && <Badge variant="secondary" className="bg-slate-800 text-slate-300">{event.resource.activity_type}</Badge>}
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Description/Notes */}
                    {(event.resource?.notes || event.resource?.description) && (
                        <div className="bg-slate-800/50 p-3 rounded-md text-sm text-slate-300 border border-white/5">
                            {event.resource?.notes || event.resource?.description}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                     {/* Temporarily disabled delete/edit for financial to simplify, can be enabled if needed */}
                     <div className="flex w-full justify-between">
                         <Button 
                            variant="ghost" 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => onDelete(event)}
                         >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                         </Button>
                         <div className="flex gap-2">
                             <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300">Fechar</Button>
                             <Button 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => onEdit(event)}
                             >
                                <Edit className="w-4 h-4 mr-2" /> Editar
                             </Button>
                         </div>
                     </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AdminCalendarEventDetails;