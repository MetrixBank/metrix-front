import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, MoreVertical, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const GoalCard = ({ goal, onUpdateProgress, onComplete, onDelete }) => {
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [newProgress, setNewProgress] = useState(goal.current_value);

    const progressPercentage = Math.min(100, Math.max(0, (goal.current_value / goal.target_value) * 100));
    const isCompleted = goal.status === 'completed';
    const isExpired = new Date(goal.end_date) < new Date() && !isCompleted;

    const handleUpdate = () => {
        onUpdateProgress(goal.id, parseFloat(newProgress));
        setIsUpdateOpen(false);
    };

    return (
        <>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className={cn(
                    "h-full flex flex-col overflow-hidden border-l-4 shadow-lg hover:shadow-2xl transition-all",
                    isCompleted ? "border-l-emerald-500 bg-emerald-950/10" : "border-l-violet-500 bg-white dark:bg-slate-950"
                )}>
                    <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-bold line-clamp-1">{goal.title}</CardTitle>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(goal.end_date), "d 'de' MMM, yyyy", { locale: ptBR })}
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsUpdateOpen(true)} disabled={isCompleted}>
                                    <Edit2 className="w-4 h-4 mr-2" /> Atualizar Progresso
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onComplete(goal.id)} disabled={isCompleted}>
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Marcar Concluída
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-red-500">
                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                            {goal.description || "Sem descrição."}
                        </p>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Progresso</span>
                                <span className={isCompleted ? "text-emerald-500" : "text-violet-500"}>
                                    {Math.round(progressPercentage)}%
                                </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" indicatorClassName={isCompleted ? "bg-emerald-500" : "bg-violet-600"} />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Atual: {goal.current_value}</span>
                                <span>Meta: {goal.target_value}</span>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="pt-2 pb-4 flex justify-between items-center border-t bg-slate-50 dark:bg-slate-900/50">
                         {isCompleted ? (
                             <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">Concluída</Badge>
                         ) : isExpired ? (
                             <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Expirada</Badge>
                         ) : (
                             <Badge variant="secondary" className="bg-violet-100 text-violet-700 border-violet-200">Em andamento</Badge>
                         )}
                         
                         {!isCompleted && (
                             <Button size="sm" variant="ghost" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50" onClick={() => setIsUpdateOpen(true)}>
                                 Atualizar
                             </Button>
                         )}
                    </CardFooter>
                </Card>
            </motion.div>

            <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Atualizar Progresso</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Valor Atual</label>
                            <Input 
                                type="number" 
                                value={newProgress} 
                                onChange={(e) => setNewProgress(e.target.value)} 
                            />
                            <p className="text-xs text-muted-foreground">
                                Meta alvo: {goal.target_value}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>Cancelar</Button>
                        <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleUpdate}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default GoalCard;