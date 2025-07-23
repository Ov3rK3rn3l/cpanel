import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Megaphone, Loader2, CalendarDays, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const AnnouncementsSection = () => {
  const { toast } = useToast();
  const { supabase, user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [authorsData, setAuthorsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);

  const fetchAnnouncementsAndAuthors = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    
    const { data: announcementsData, error: announcementsError } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (announcementsError) {
      toast({ title: "Erro ao buscar anúncios", description: announcementsError.message, variant: "destructive" });
      setAnnouncements([]);
    } else {
      setAnnouncements(announcementsData || []);
      const userIds = [...new Set(announcementsData.map(ann => ann.user_id).filter(id => id))];
      if (userIds.length > 0) {
        const { data: membersInfo, error: membersError } = await supabase
          .from('members')
          .select('user_id, codinome')
          .in('user_id', userIds);

        if (membersError) {
          console.error("Erro ao buscar codinomes dos criadores:", membersError);
        } else {
          const authorsMap = membersInfo.reduce((acc, m) => {
            if (m.user_id) acc[m.user_id] = m.codinome;
            return acc;
          }, {});
          setAuthorsData(authorsMap);
        }
      }
    }
    setIsLoading(false);
  }, [supabase, toast]);


  useEffect(() => {
    fetchAnnouncementsAndAuthors();
  }, [fetchAnnouncementsAndAuthors]);

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!supabase || !user) return;

    const formData = new FormData(e.target);
    const announcementData = {
      title: formData.get('title'),
      content: formData.get('content'),
      user_id: user.id,
      user_email: user.email, 
    };

    let error;
    if (currentAnnouncement) {
      const { error: updateError } = await supabase.from('announcements').update(announcementData).eq('id', currentAnnouncement.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('announcements').insert([announcementData]);
      error = insertError;
    }

    if (error) {
      toast({ title: `Erro ao ${currentAnnouncement ? 'atualizar' : 'publicar'} anúncio`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Anúncio ${currentAnnouncement ? 'atualizado' : 'publicado'}!`, description: `Anúncio "${announcementData.title}" foi ${currentAnnouncement ? 'atualizado' : 'publicado'}.` });
      fetchAnnouncementsAndAuthors();
    }
    setIsAnnouncementDialogOpen(false);
    setCurrentAnnouncement(null);
  };

  const openAnnouncementDialog = (announcement = null) => {
    setCurrentAnnouncement(announcement);
    setIsAnnouncementDialogOpen(true);
  };

  const deleteAnnouncement = async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro ao remover anúncio", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Anúncio removido!", description: "O anúncio foi removido.", variant: "default" });
      fetchAnnouncementsAndAuthors();
    }
  };
  
  const getAuthorDisplay = (ann) => {
    return authorsData[ann.user_id] || ann.user_email || "Desconhecido";
  };

  return (
    <motion.section variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-semibold text-foreground flex items-center">
          <Megaphone className="mr-3 h-8 w-8 text-primary" /> Anúncios Importantes
        </h2>
        <Button onClick={() => openAnnouncementDialog()} className="btn-primary-dark w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Novo Anúncio
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 text-primary animate-spin" /> <p className="ml-4 text-xl text-muted-foreground">Carregando anúncios...</p></div>
      ) : announcements.length === 0 ? (
        <Card className="text-center glassmorphic">
          <CardContent className="p-10">
            <Megaphone size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">Nenhum anúncio publicado ainda.</p>
            <p className="text-sm text-muted-foreground">Clique em "Novo Anúncio" para criar um.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {announcements.map((ann, index) => (
              <motion.div
                key={ann.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glassmorphic hover:shadow-primary/20">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-xl text-primary break-all">{ann.title}</CardTitle>
                      <div className="flex space-x-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openAnnouncementDialog(ann)} className="text-primary hover:text-brand-blue-light" aria-label="Editar Anúncio">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-red-400" aria-label="Deletar Anúncio">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o anúncio "{ann.title}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="btn-secondary-dark">Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteAnnouncement(ann.id)} className="btn-destructive-dark">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground pt-1 flex flex-wrap gap-x-3">
                        <span className="flex items-center"><CalendarDays className="inline mr-1 h-3 w-3" /> 
                        {new Date(ann.created_at).toLocaleString('pt-BR')}</span>
                        <span className="flex items-center"><UserCircle className="inline mr-1 h-3 w-3" /> 
                        Por: {getAuthorDisplay(ann)}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap break-words">{ann.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}


      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">{currentAnnouncement ? 'Editar Anúncio' : 'Novo Anúncio'}</DialogTitle>
            <DialogDescription>
              {currentAnnouncement ? 'Atualize os detalhes do anúncio.' : 'Crie um novo anúncio para a comunidade.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAnnouncementSubmit} className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="ann_title" className="text-muted-foreground">Título</Label>
              <Input id="ann_title" name="title" defaultValue={currentAnnouncement?.title} className="input-dark" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ann_content" className="text-muted-foreground">Conteúdo</Label>
              <Textarea id="ann_content" name="content" defaultValue={currentAnnouncement?.content} className="input-dark min-h-[150px]" required />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="btn-secondary-dark">Cancelar</Button>
              </DialogClose>
              <Button type="submit" className="btn-primary-dark">{currentAnnouncement ? 'Salvar Anúncio' : 'Publicar Anúncio'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
};

export default AnnouncementsSection;