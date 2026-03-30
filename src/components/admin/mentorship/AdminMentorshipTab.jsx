import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, GripVertical, Loader2, Video, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';

const AdminMentorshipTab = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isvideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mentorship_sections')
        .select('*, videos:mentorship_videos(*)')
        .order('order', { ascending: true })
        .order('order', { foreignTable: 'mentorship_videos', ascending: true });
      if (error) throw error;
      setSections(data);
    } catch (error) {
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === 'SECTIONS') {
      const newSections = Array.from(sections);
      const [reorderedItem] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedItem);
      setSections(newSections);
      updateOrder(newSections.map(s => s.id), 'mentorship_sections');
    } else if (type.startsWith('VIDEOS_')) {
      const sectionId = type.split('_')[1];
      const sectionIndex = sections.findIndex(s => s.id === sectionId);
      const newVideos = Array.from(sections[sectionIndex].videos);
      const [reorderedItem] = newVideos.splice(source.index, 1);
      newVideos.splice(destination.index, 0, reorderedItem);
      
      const newSections = [...sections];
      newSections[sectionIndex].videos = newVideos;
      setSections(newSections);
      updateOrder(newVideos.map(v => v.id), 'mentorship_videos');
    }
  };

  const updateOrder = async (ids, tableName) => {
    const updates = ids.map((id, index) => 
      supabase.from(tableName).update({ order: index }).eq('id', id)
    );
    const { error } = await Promise.all(updates);
    if (error) {
      toast({ title: 'Erro ao reordenar', description: error.message, variant: 'destructive' });
      fetchData(); // Revert on error
    } else {
      toast({ title: 'Ordem atualizada com sucesso!' });
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const upsertData = {
      title: data.title,
      description: data.description,
    };

    let query;
    if (editingSection) {
      query = supabase.from('mentorship_sections').update(upsertData).eq('id', editingSection.id);
    } else {
      query = supabase.from('mentorship_sections').insert({ ...upsertData, order: sections.length });
    }

    const { error } = await query;
    if (error) {
      toast({ title: 'Erro ao salvar seção', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Seção ${editingSection ? 'atualizada' : 'criada'} com sucesso!` });
      setIsSectionModalOpen(false);
      setEditingSection(null);
      fetchData();
    }
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const upsertData = {
      title: data.title,
      description: data.description,
      youtube_url: data.youtube_url,
      section_id: currentSectionId,
    };

    let query;
    if (editingVideo) {
      query = supabase.from('mentorship_videos').update(upsertData).eq('id', editingVideo.id);
    } else {
      const section = sections.find(s => s.id === currentSectionId);
      query = supabase.from('mentorship_videos').insert({ ...upsertData, order: section.videos.length });
    }

    const { error } = await query;
    if (error) {
      toast({ title: 'Erro ao salvar vídeo', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Vídeo ${editingVideo ? 'atualizado' : 'adicionado'} com sucesso!` });
      setIsVideoModalOpen(false);
      setEditingVideo(null);
      setCurrentSectionId(null);
      fetchData();
    }
  };

  const handleDelete = async (id, tableName, name) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      toast({ title: `Erro ao excluir ${tableName === 'mentorship_sections' ? 'seção' : 'vídeo'}`, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${tableName === 'mentorship_sections' ? 'Seção' : 'Vídeo'} excluído com sucesso!` });
      fetchData();
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Mentorias</h1>
        <Button onClick={() => { setEditingSection(null); setIsSectionModalOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Seção
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections" type="SECTIONS">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div className="flex items-center">
                            <div {...provided.dragHandleProps} className="cursor-grab p-2">
                              <GripVertical />
                            </div>
                            <CardTitle>{section.title}</CardTitle>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => { setEditingSection(section); setIsSectionModalOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(section.id, 'mentorship_sections', section.title)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{section.description}</p>
                          <Droppable droppableId={section.id} type={`VIDEOS_${section.id}`}>
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef} className="mt-4 space-y-2">
                                {section.videos.map((video, videoIndex) => (
                                  <Draggable key={video.id} draggableId={video.id} index={videoIndex}>
                                    {(provided) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} className="flex items-center p-2 bg-muted/50 rounded-md">
                                        <div {...provided.dragHandleProps} className="cursor-grab p-2">
                                          <GripVertical size={16} />
                                        </div>
                                        <Video size={16} className="mr-2" />
                                        <span className="flex-1">{video.title}</span>
                                        <Button variant="ghost" size="sm" onClick={() => { setEditingVideo(video); setCurrentSectionId(section.id); setIsVideoModalOpen(true); }}>
                                          <Edit size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(video.id, 'mentorship_videos', video.title)}>
                                          <Trash2 size={16} />
                                        </Button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </CardContent>
                        <CardFooter>
                          <Button variant="secondary" onClick={() => { setCurrentSectionId(section.id); setEditingVideo(null); setIsVideoModalOpen(true); }}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Vídeo
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Editar Seção' : 'Nova Seção'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSectionSubmit}>
            <div className="space-y-4 py-4">
              <Input name="title" placeholder="Título da Seção" defaultValue={editingSection?.title} required />
              <Textarea name="description" placeholder="Descrição da Seção" defaultValue={editingSection?.description} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isvideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVideo ? 'Editar Vídeo' : 'Novo Vídeo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVideoSubmit}>
            <div className="space-y-4 py-4">
              <Input name="title" placeholder="Título do Vídeo" defaultValue={editingVideo?.title} required />
              <Input name="youtube_url" placeholder="URL do YouTube" defaultValue={editingVideo?.youtube_url} required type="url" />
              <Textarea name="description" placeholder="Descrição do Vídeo" defaultValue={editingVideo?.description} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMentorshipTab;