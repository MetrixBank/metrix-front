import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Plus, Trash2, Edit2 } from 'lucide-react';

const FunnelConfigurationView = ({ stages, createStage, updateStage, deleteStage, suggestedMessages, createSuggestedMessage, deleteSuggestedMessage }) => {
  const [editingStage, setEditingStage] = useState(null);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [newMessageData, setNewMessageData] = useState({ message: '', title: '', type: 'custom', stage_id: '' });

  const handleOpenStageModal = (stage = null) => {
    setEditingStage(stage || { name: '', color: '#3b82f6' });
    setIsStageModalOpen(true);
  };

  const handleSaveStage = async (e) => {
    e.preventDefault();
    if (editingStage.id) await updateStage(editingStage.id, { name: editingStage.name, color: editingStage.color });
    else await createStage({ name: editingStage.name, color: editingStage.color, stage_order: stages.length + 1 });
    setIsStageModalOpen(false);
  };

  const handleSaveMessage = async () => {
      if (!newMessageData.stage_id || !newMessageData.message) return;
      await createSuggestedMessage(newMessageData);
      setNewMessageData({ message: '', title: '', type: 'custom', stage_id: '' });
      setIsMessageModalOpen(false);
  };

  return (
    <Tabs defaultValue="stages" className="w-full">
      <TabsList className="mb-4"><TabsTrigger value="stages">Etapas do Funil</TabsTrigger><TabsTrigger value="messages">Mensagens Modelos</TabsTrigger></TabsList>
      <TabsContent value="stages">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Etapas do Funil</CardTitle><CardDescription>Personalize as etapas do seu processo de vendas.</CardDescription></div><Button onClick={() => handleOpenStageModal()}><Plus className="h-4 w-4 mr-2" /> Nova Etapa</Button></CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {stages.map((stage) => (
                        <div key={stage.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: stage.color }} />
                            <div className="flex-1 font-medium">{stage.name}</div>
                            <div className="text-xs text-muted-foreground mr-4">Ordem: {stage.stage_order}</div>
                            <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleOpenStageModal(stage)}><Edit2 className="h-4 w-4" /></Button>{!stage.is_system && (<Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteStage(stage.id)}><Trash2 className="h-4 w-4" /></Button>)}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="messages">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Mensagens Modelos</CardTitle><CardDescription>Crie scripts prontos para agilizar seu atendimento.</CardDescription></div><Button onClick={() => setIsMessageModalOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova Mensagem</Button></CardHeader>
            <CardContent>
                {stages.map(stage => {
                    const stageMsgs = suggestedMessages.filter(m => m.stage_id === stage.id);
                    if (stageMsgs.length === 0) return null;
                    return (
                        <div key={stage.id} className="mb-6 last:mb-0">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />{stage.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {stageMsgs.map(msg => (<div key={msg.id} className="border p-3 rounded-lg relative group"><h4 className="font-medium text-xs mb-1">{msg.title || 'Sem título'}</h4><p className="text-sm text-muted-foreground line-clamp-2">{msg.message}</p><Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 text-destructive" onClick={() => deleteSuggestedMessage(msg.id)}><Trash2 className="h-3 w-3" /></Button></div>))}
                            </div>
                        </div>
                    );
                })}
                 {suggestedMessages.length === 0 && <div className="text-center py-8 text-muted-foreground">Nenhuma mensagem configurada.</div>}
            </CardContent>
         </Card>
      </TabsContent>
      <Dialog open={isStageModalOpen} onOpenChange={setIsStageModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingStage?.id ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle></DialogHeader><form onSubmit={handleSaveStage} className="space-y-4"><div className="space-y-2"><Label>Nome da Etapa</Label><Input value={editingStage?.name || ''} onChange={e => setEditingStage({...editingStage, name: e.target.value})} required /></div><div className="space-y-2"><Label>Cor</Label><div className="flex gap-2">{['#3b82f6', '#eab308', '#a855f7', '#22c55e', '#ef4444', '#f97316', '#ec4899', '#64748b'].map(color => (<button key={color} type="button" className={`w-8 h-8 rounded-full border-2 ${editingStage?.color === color ? 'border-black' : 'border-transparent'}`} style={{ backgroundColor: color }} onClick={() => setEditingStage({...editingStage, color})} />))}</div></div><DialogFooter><Button type="submit">Salvar</Button></DialogFooter></form></DialogContent>
      </Dialog>
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nova Mensagem Modelo</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Título (Opcional)</Label><Input placeholder="Ex: Saudação Inicial" value={newMessageData.title} onChange={e => setNewMessageData({...newMessageData, title: e.target.value})} /></div><div className="space-y-2"><Label>Etapa</Label><Select onValueChange={(val) => setNewMessageData({...newMessageData, stage_id: val})}><SelectTrigger><SelectValue placeholder="Selecione a etapa..." /></SelectTrigger><SelectContent>{stages.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label>Mensagem</Label><Textarea className="h-32" placeholder="Digite o texto da mensagem..." value={newMessageData.message} onChange={e => setNewMessageData({...newMessageData, message: e.target.value})} /></div><DialogFooter><Button onClick={handleSaveMessage}>Salvar</Button></DialogFooter></div></DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default FunnelConfigurationView;