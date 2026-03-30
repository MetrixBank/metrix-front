import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Zap, RefreshCw, Check, MessageSquare, Loader2, AlertTriangle, CheckCircle, Clock, Edit, Wrench, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, getActivityTypePortuguese } from '@/lib/utils';
import { subDays, formatISO, differenceInDays, parseISO, isAfter, isBefore, startOfToday } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';
import { AiAssistantContext } from '@/contexts/AiAssistantContext';
import AiAssistantInsights from './AiAssistantInsights';

const TaskCard = ({ task, onComplete, onWhatsAppClick, onNavigateToAgenda, onEditActivity, isOverdue = false, isCompleted = false }) => {
    const { details, task_type, due_date, customer_name, visit_date, status, updated_at, is_opportunity } = task;
    
    const customer = details?.customer_name || customer_name || 'Cliente';
    const date = due_date || visit_date;

    const getTaskInfo = () => {
        const productNames = details?.product_names ? details.product_names.join(', ') : 'produtos';
        const saleDate = details?.sale_date ? formatDate(details.sale_date) : 'data da venda';

        switch (task_type) {
            case 'daily_planning':
                return {
                    icon: <Zap className="w-4 h-4 mr-2" />,
                    title: details.title || 'Planejamento Diário',
                    description: details.description || 'Dedique 15 minutos para planejar suas principais atividades de prospecção e follow-up hoje.',
                    whatsappMessage: null,
                };
            case 'review_inactive_customers':
                return {
                    icon: <RefreshCw className="w-4 h-4 mr-2" />,
                    title: details.title || 'Reativar Contatos',
                    description: details.description || 'Identifique 3 clientes que não compram há mais de 6 meses e envie uma mensagem de reengajamento.',
                    whatsappMessage: `Olá [Nome do Cliente], tudo bem? Faz um tempinho que não conversamos. Passando para saber como você está e se precisa de algo.`,
                };
            case 'post_sale_follow_up':
                return {
                    icon: <MessageSquare className="w-4 h-4 mr-2" />,
                    title: `Pós-venda (D+15): ${customer}`,
                    description: `Venda de ${productNames} em ${saleDate}. Ótimo momento para um follow-up e pedir indicações!`,
                    whatsappMessage: `Olá ${customer}, tudo bem? Passando para saber como está sua experiência com o(s) ${productNames}. Se estiver tudo ótimo, que tal me indicar 5 amigos para conhecerem essa tecnologia? 😉`,
                };
             case 'cleaning_and_referrals':
                return {
                    icon: <Wrench className="w-4 h-4 mr-2" />,
                    title: `Limpeza e Indicações: ${customer}`,
                    description: `Cliente comprou ${productNames} há 2 meses. Agende uma limpeza e peça 5 indicações!`,
                    whatsappMessage: `Olá ${customer}, tudo bem? Para garantir o máximo de eficiência do seu produto, gostaria de agendar uma visita para limpeza e manutenção. Aproveitando, que tal me indicar 5 amigos para conhecerem essa tecnologia?`,
                };
             case 'refill_replacement':
                return {
                    icon: <RefreshCw className="w-4 h-4 mr-2" />,
                    title: `Troca de Refil: ${customer}`,
                    description: `Venda de ${productNames} em saleDate. Agende a troca do refil/vela para manter a qualidade da água!`,
                    whatsappMessage: `Olá ${customer}, tudo bem? Já se passaram 9 meses desde a sua compra! Está na hora de trocarmos o refil do seu purificador para garantir a qualidade da sua água. Vamos agendar?`,
                };
            case 'update_past_activity':
                 return {
                    icon: <AlertTriangle className="w-4 h-4 mr-2" />,
                    title: `Atualizar Atividade: ${customer}`,
                    description: `A atividade de "${getActivityTypePortuguese(details.activity_type)}" em ${formatDate(details.activity_date)} precisa de um desfecho.`,
                    whatsappMessage: `Olá ${customer}, tudo bem? Gostaria de confirmar o que aconteceu com nossa atividade agendada.`,
                };
            default:
                const activityTitle = is_opportunity ? `Visita da Semana: ${getActivityTypePortuguese(task_type)}` : `Tarefa: ${task_type}`;
                return {
                    icon: <Clock className="w-4 h-4 mr-2" />,
                    title: `${activityTitle} com ${customer}`,
                    description: `Visita agendada com ${customer} para esta semana.`,
                    whatsappMessage: `Olá ${customer}, tudo bem? Confirmando nossa atividade agendada para esta semana.`,
                };
        }
    };

    const { title, description, whatsappMessage, icon } = getTaskInfo();
    const daysOverdue = isOverdue ? differenceInDays(startOfToday(), parseISO(date)) : 0;
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
            className={`p-4 rounded-lg border space-y-3 ${isOverdue ? 'bg-amber-500/10 border-amber-500/30' : (isCompleted ? 'bg-green-500/10 border-green-500/30' : 'bg-background/50 border-border/50')}`}
        >
            <div>
                 <h4 className={`font-semibold flex items-center ${isOverdue ? 'text-amber-400' : (isCompleted ? 'text-green-400' : 'text-primary')}`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4 mr-2" /> : icon}
                    {title}
                </h4>
                <p className="text-sm text-muted-foreground">{description}</p>
                {!is_opportunity && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {isCompleted ? `Concluída em: ${formatDate(updated_at)}` : 
                        isOverdue ? `Atrasada há ${daysOverdue} dia(s)` : `Vencimento: ${formatDate(date)}`}
                    </p>
                )}
                 {is_opportunity && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Agendado para: {formatDate(date)}
                    </p>
                )}
            </div>
            {!isCompleted && (
                <div className="flex items-center justify-end space-x-2">
                    {whatsappMessage && (
                        <Button variant="outline" size="sm" onClick={() => onWhatsAppClick(task, whatsappMessage)}>
                            <MessageSquare className="w-4 h-4 mr-1" /> WhatsApp
                        </Button>
                    )}
                    {task.task_type === 'update_past_activity' ? (
                        <Button variant="secondary" size="sm" onClick={() => onEditActivity(task.related_opportunity_id)}>
                            <Edit className="w-4 h-4 mr-1" /> Atualizar
                        </Button>
                    ) : is_opportunity ? (
                         <Button variant="secondary" size="sm" onClick={onNavigateToAgenda}>
                            <Clock className="w-4 h-4 mr-1" /> Ver na Agenda
                        </Button>
                    ) : (
                        <Button variant="success" size="sm" onClick={() => onComplete(task)}>
                            <Check className="w-4 h-4 mr-1" /> Concluir
                        </Button>
                    )}
                </div>
            )}
        </motion.div>
    );
};

const AiAssistant = ({ isOpen, onClose, onNavigateToCustomer, onNavigateToAgenda, onOpenActivityModal }) => {
    const { tasks, isLoading, refreshTasks } = useContext(AiAssistantContext);
    const [activeTab, setActiveTab] = useState("missions");

    useEffect(() => {
        if (isOpen) {
            refreshTasks();
        }
    }, [isOpen, refreshTasks]);
    
    const { pendingTasks, completedTasks, overdueTasks, progress } = useMemo(() => {
        const today = startOfToday();
        const twentyDaysAgo = subDays(today, 20);

        const allPending = tasks.filter(t => t.status === 'pending' && !t.is_opportunity);
        const allCompleted = tasks.filter(t => t.status === 'completed' && t.updated_at && isAfter(parseISO(t.updated_at), twentyDaysAgo));

        const overdue = allPending.filter(t => t.due_date && isBefore(parseISO(t.due_date), today));
        const pending = allPending.filter(t => t.due_date && !isBefore(parseISO(t.due_date), today));
        
        const weeklyVisits = tasks.filter(t => t.is_opportunity);

        const totalTasksForProgress = allPending.length + allCompleted.length;
        const completionPercentage = totalTasksForProgress > 0 ? (allCompleted.length / totalTasksForProgress) * 100 : 0;

        return {
            pendingTasks: [...overdue, ...pending, ...weeklyVisits].sort((a,b) => new Date(a.due_date) - new Date(b.due_date)),
            completedTasks: allCompleted.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)),
            overdueTasks: overdue,
            progress: completionPercentage,
        };
    }, [tasks]);
    
    const handleCompleteTask = async (task) => {
        if (task.is_opportunity) {
            toast({ title: 'Ação não permitida', description: 'Visitas da semana são informativas. Gerencie-as na agenda.', variant: 'destructive' });
            return;
        }

        try {
            const { error } = await supabase
                .from('ai_assistant_tasks')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', task.id);
            
            if (error) throw error;
            
            toast({ title: 'Missão Concluída!', description: 'Bom trabalho, continue assim!' });
            refreshTasks();
        } catch (error) {
            console.error("Error completing task:", error);
            toast({ title: 'Erro ao concluir tarefa', description: error.message, variant: 'destructive' });
        }
    };
    
    const handleWhatsAppClick = async (task, message) => {
        let customerPhone = null;

        if (task.is_opportunity) {
            customerPhone = task.customer_phone;
        } else if (task.related_opportunity_id) {
            const { data, error } = await supabase.from('sales_opportunities').select('customer_phone').eq('id', task.related_opportunity_id).single();
            if (error) {
                console.error("Error fetching opportunity phone:", error);
                toast({ title: 'Erro ao buscar telefone', description: 'Não foi possível encontrar o telefone da atividade relacionada.', variant: 'destructive' });
                return;
            }
            customerPhone = data?.customer_phone;
        } else {
            const { data, error } = await supabase.from('customers').select('phone').eq('id', task.customer_id).single();
            if (error) {
                 console.error("Error fetching customer phone:", error);
            }
            customerPhone = data?.phone;
        }

        if (!customerPhone) {
            toast({ title: 'Telefone não encontrado', description: 'O cliente não possui um telefone cadastrado para iniciar a conversa.', variant: 'destructive' });
            onClose();
            onNavigateToCustomer(false);
            return;
        }
        const phone = customerPhone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };
    
    const handleEditActivity = async (opportunityId) => {
        onClose();
        const { data: activityData, error } = await supabase
            .from('sales_opportunities')
            .select(`*, opportunity_products:opportunity_products(*, products:products(*))`)
            .eq('id', opportunityId)
            .single();

        if (error || !activityData) {
            toast({ title: 'Erro ao carregar atividade', description: error?.message || 'Atividade não encontrada.', variant: 'destructive' });
            return;
        }
        onOpenActivityModal(activityData);
    };

    const handleNavigate = () => {
        onClose();
        onNavigateToAgenda();
    };

    const pendingItems = pendingTasks;
    const assistantIconUrl = "https://horizons-cdn.hostinger.com/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/2da79d9a13d587bb8b908cfd2f0c3273.png";
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg card-gradient">
                <DialogHeader>
                    <DialogTitle className="text-gradient flex items-center">
                        <div className="w-8 h-8 mr-2 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
                           <img src={assistantIconUrl} alt="Assistente IA" className="w-6 h-6 object-contain" />
                        </div>
                        Assistente GSP IA
                    </DialogTitle>
                    <DialogDescription>
                        Suas missões e insights para decolar nos resultados!
                    </DialogDescription>
                </DialogHeader>
                
                <div className='px-1'>
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <span className='font-medium text-muted-foreground'>Progresso de Missões</span>
                        <span className='font-bold text-primary'>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full h-2" />
                    {overdueTasks.length > 0 && 
                        <p className='text-amber-400 text-xs text-center mt-2 animate-pulse'>
                            Você tem {overdueTasks.length} missão(ões) atrasada(s)!
                        </p>
                    }
                </div>

                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="missions"><Clock className="w-4 h-4 mr-2" />Missões ({pendingItems.length})</TabsTrigger>
                        <TabsTrigger value="insights"><BrainCircuit className="w-4 h-4 mr-2" />Insights</TabsTrigger>
                        <TabsTrigger value="completed"><CheckCircle className="w-4 h-4 mr-2" />Concluídas</TabsTrigger>
                    </TabsList>
                    <div className="mt-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                         {isLoading ? (
                            <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <TabsContent value="missions" forceMount={activeTab === 'missions'}>
                                    <motion.div key="missions" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
                                        {pendingItems.length === 0 ? (
                                            <div className="text-center py-10">
                                                <Zap className="w-12 h-12 mx-auto text-green-500" />
                                                <p className="mt-4 font-semibold">Tudo em ordem por aqui!</p>
                                                <p className="text-sm text-muted-foreground">Nenhuma missão ou visita pendente. Bom trabalho!</p>
                                            </div>
                                        ) : (
                                            pendingItems.map(task => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    onComplete={handleCompleteTask}
                                                    onWhatsAppClick={handleWhatsAppClick}
                                                    onNavigateToAgenda={handleNavigate}
                                                    onEditActivity={handleEditActivity}
                                                    isOverdue={!task.is_opportunity && task.due_date && isBefore(parseISO(task.due_date), startOfToday())}
                                                />
                                            ))
                                        )}
                                    </motion.div>
                                </TabsContent>
                                <TabsContent value="insights" forceMount={activeTab === 'insights'}>
                                     <motion.div key="insights" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
                                        <AiAssistantInsights />
                                    </motion.div>
                                </TabsContent>
                                <TabsContent value="completed" forceMount={activeTab === 'completed'}>
                                     <motion.div key="completed" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
                                        {completedTasks.length === 0 ? (
                                            <div className="text-center py-10">
                                                <Zap className="w-12 h-12 mx-auto text-gray-500" />
                                                <p className="mt-4 font-semibold">Histórico de missões vazio.</p>
                                                <p className="text-sm text-muted-foreground">Conclua algumas missões para vê-las aqui.</p>
                                            </div>
                                        ) : (
                                            completedTasks.map(task => (
                                                <TaskCard key={task.id} task={task} isCompleted={true} />
                                            ))
                                        )}
                                    </motion.div>
                                </TabsContent>
                            </AnimatePresence>
                        )}
                    </div>
                </Tabs>

                <div className="mt-4 flex justify-end">
                    <Button variant="ghost" onClick={refreshTasks} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AiAssistant;