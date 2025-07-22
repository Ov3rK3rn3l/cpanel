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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Target, CalendarDays, Info, CheckCircle, XCircle, Loader2, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const MISSION_STATUS_OPTIONS = ["Programada", "Em Andamento", "Concluída", "Cancelada"];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const getStatusClass = (status) => {
    switch (status) {
      case "Programada": return "bg-blue-600 text-white";
      case "Em Andamento": return "bg-yellow-500 text-black";
      case "Concluída": return "bg-green-600 text-white";
      case "Cancelada": return "bg-red-600 text-white";
      default: return "bg-gray-500 text-white";
    }
  };
const getStatusIcon = (status) => {
  switch (status) {
    case "Programada": return <CalendarDays className="h-4 w-4 mr-1" />;
    case "Em Andamento": return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
    case "Concluída": return <CheckCircle className="h-4 w-4 mr-1" />;
    case "Cancelada": return <XCircle className="h-4 w-4 mr-1" />;
    default: return <Info className="h-4 w-4 mr-1" />;
  }
};


const MissionsSection = () => {
  const { toast } = useToast();
  const { supabase, user } = useAuth();
  const [missions, setMissions] = useState([]);
  const [authorsData, setAuthorsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMissionDialogOpen, setIsMissionDialogOpen] = useState(false);
  const [currentMission, setCurrentMission] = useState(null);

  const fetchMissionsAndAuthors = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    
    const { data: missionsData, error: missionsError } = await supabase
      .from('missions')
      .select('*')
      .order('date', { ascending: false });

    if (missionsError) {
      toast({ title: "Erro ao buscar missões", description: missionsError.message, variant: "destructive" });
      setMissions([]);
    } else {
      setMissions(missionsData || []);
      const userIds = [...new Set(missionsData.map(mission => mission.user_id).filter(id => id))];
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
    fetchMissionsAndAuthors();
  }, [fetchMissionsAndAuthors]);

  const handleMissionSubmit = async (e) => {
    e.preventDefault();
    if (!supabase || !user) return;

    const formData = new FormData(e.target);
    const missionData = {
      title: formData.get('title'),
      description: formData.get('description'),
      date: formData.get('date'),
      status: formData.get('status'),
      coins_for_presence: parseInt(formData.get('coins_for_presence'), 10) || 0,
      coins_for_positive_feedback_bonus: parseInt(formData.get('coins_for_positive_feedback_bonus'), 10) || 0,
      user_id: user.id, 
      user_email: user.email,
    };
    
    let error;
    if (currentMission) {
      const { error: updateError } = await supabase.from('missions').update(missionData).eq('id', currentMission.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('missions').insert([missionData]);
      error = insertError;
    }

    if (error) {
      toast({ title: `Erro ao ${currentMission ? 'atualizar' : 'adicionar'} missão`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Missão ${currentMission ? 'atualizada' : 'adicionada'}!`, description: `A missão "${missionData.title}" foi ${currentMission ? 'atualizada' : 'adicionada'} com sucesso.` });
      fetchMissionsAndAuthors();
    }
    setIsMissionDialogOpen(false);
    setCurrentMission(null);
  };

  const openMissionDialog = (mission = null) => {
    setCurrentMission(mission);
    setIsMissionDialogOpen(true);
  };

  const deleteMission = async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from('missions').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro ao remover missão", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Missão removida!", description: "A missão foi removida da lista.", variant: "default" });
      fetchMissionsAndAuthors();
    }
  };

  const getAuthorDisplay = (mission) => {
    return authorsData[mission.user_id] || mission.user_email || 'Comando';
  };
  
  return (
    <motion.section variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-semibold text-foreground flex items-center">
          <Target className="mr-3 h-8 w-8 text-primary" /> Gerenciamento de Missões
        </h2>
        <Button onClick={() => openMissionDialog()} className="btn-primary-dark w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Missão
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 text-primary animate-spin" /> <p className="ml-4 text-xl text-muted-foreground">Carregando missões...</p></div>
      ) : missions.length === 0 ? (
        <Card className="text-center glassmorphic">
          <CardContent className="p-10">
            <Target size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">Nenhuma missão cadastrada ainda.</p>
            <p className="text-sm text-muted-foreground">Clique em "Adicionar Missão" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {missions.map((mission, index) => (
              <motion.div
                key={mission.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full flex flex-col glassmorphic hover:shadow-primary/20">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl text-primary break-all">{mission.title}</CardTitle>
                      <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${getStatusClass(mission.status)}`}>
                        {getStatusIcon(mission.status)}
                        {mission.status}
                      </div>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground pt-1 flex flex-col sm:flex-row sm:gap-x-3">
                        <span className="flex items-center"><CalendarDays className="inline mr-1 h-3 w-3" /> 
                        {mission.date ? new Date(mission.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data não definida'}</span>
                        <span className="flex items-center mt-1 sm:mt-0"><UserCircle className="inline mr-1 h-3 w-3" /> 
                        Por: {getAuthorDisplay(mission)}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-foreground whitespace-pre-wrap break-words">{mission.description}</p>
                  </CardContent>
                  <div className="p-4 pt-2 border-t border-border mt-auto">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openMissionDialog(mission)} className="text-primary hover:text-brand-blue-light" aria-label="Editar Missão">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-red-400" aria-label="Deletar Missão">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a missão "{mission.title}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="btn-secondary-dark">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMission(mission.id)} className="btn-destructive-dark">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={isMissionDialogOpen} onOpenChange={setIsMissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">{currentMission ? 'Editar Missão' : 'Adicionar Nova Missão'}</DialogTitle>
            <DialogDescription>
              {currentMission ? 'Atualize os detalhes da missão.' : 'Preencha os detalhes da nova missão.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMissionSubmit} className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="mission_title" className="text-muted-foreground">Título</Label>
              <Input id="mission_title" name="title" defaultValue={currentMission?.title} className="input-dark" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mission_description" className="text-muted-foreground">Descrição</Label>
              <Textarea id="mission_description" name="description" defaultValue={currentMission?.description} className="input-dark min-h-[100px]" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mission_date" className="text-muted-foreground">Data</Label>
              <Input id="mission_date" name="date" type="date" defaultValue={currentMission?.date} className="input-dark" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="coins_for_presence" className="text-muted-foreground">Moedas por Presença</Label>
                <Input id="coins_for_presence" name="coins_for_presence" type="number" defaultValue={currentMission?.coins_for_presence || 0} className="input-dark" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="coins_for_positive_feedback_bonus" className="text-muted-foreground">Bônus Feedback (+50%)</Label>
                <Input id="coins_for_positive_feedback_bonus" name="coins_for_positive_feedback_bonus" type="number" defaultValue={currentMission?.coins_for_positive_feedback_bonus || 0} className="input-dark" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="mission_status" className="text-muted-foreground">Status</Label>
              <Select name="status" defaultValue={currentMission?.status || MISSION_STATUS_OPTIONS[0]}>
                <SelectTrigger className="input-dark">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {MISSION_STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt} className="hover:bg-accent focus:bg-accent">{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="btn-secondary-dark">Cancelar</Button>
              </DialogClose>
              <Button type="submit" className="btn-primary-dark">{currentMission ? 'Salvar Alterações' : 'Adicionar Missão'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
};

export default MissionsSection;