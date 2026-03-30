import React, { useState } from 'react';
import usePersonalGoals from '@/hooks/usePersonalGoals';
import GoalCard from './GoalCard';
import { Button } from '@/components/ui/button';
import { Plus, Target, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

const PersonalGoalsManager = () => {
    const { goals, loading, createGoal, updateProgress, completeGoal, deleteGoal } = usePersonalGoals();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newGoal, setNewGoal] = useState({ name: '', description: '', target_value: '', end_date: '' });
    const [createLoading, setCreateLoading] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            await createGoal(newGoal);
            setIsCreateOpen(false);
            setNewGoal({ name: '', description: '', target_value: '', end_date: '' });
        } catch (error) {
            // Error handled in hook
        } finally {
            setCreateLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-violet-900/10 to-purple-900/10 p-6 rounded-2xl border border-violet-200/20 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Minhas Metas</h2>
                    <p className="text-muted-foreground">Defina e acompanhe seus objetivos pessoais.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> Nova Meta
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Nova Meta</DialogTitle>
                            <DialogDescription>Preencha os detalhes do seu novo objetivo.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da Meta</Label>
                                <Input 
                                    id="name" 
                                    required 
                                    placeholder="Ex: Atingir 100 vendas" 
                                    value={newGoal.name}
                                    onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição (Opcional)</Label>
                                <Textarea 
                                    id="description" 
                                    placeholder="Detalhes sobre como atingir..." 
                                    value={newGoal.description}
                                    onChange={e => setNewGoal({...newGoal, description: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="target">Valor Alvo (Numérico)</Label>
                                    <Input 
                                        id="target" 
                                        type="number" 
                                        required 
                                        placeholder="100" 
                                        value={newGoal.target_value}
                                        onChange={e => setNewGoal({...newGoal, target_value: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Data Limite</Label>
                                    <Input 
                                        id="date" 
                                        type="date" 
                                        required 
                                        value={newGoal.end_date}
                                        onChange={e => setNewGoal({...newGoal, end_date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="mt-6">
                                <Button type="submit" disabled={createLoading} className="bg-violet-600 hover:bg-violet-700">
                                    {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Criar Meta
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {goals.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                    <h3 className="text-lg font-medium text-foreground">Nenhuma meta ativa</h3>
                    <p className="text-muted-foreground">Comece criando sua primeira meta pessoal!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => (
                        <GoalCard 
                            key={goal.id} 
                            goal={goal} 
                            onUpdateProgress={updateProgress}
                            onComplete={completeGoal}
                            onDelete={deleteGoal}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PersonalGoalsManager;