import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MessageSquare, Users, Send, ThumbsUp, ThumbsDown, Meh, UserCheck, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const FEEDBACK_TYPES = [
  { value: 'Positivo', label: 'Positivo', icon: <ThumbsUp className="h-4 w-4 text-green-500 mr-2" /> },
  { value: 'Neutro', label: 'Neutro', icon: <Meh className="h-4 w-4 text-yellow-500 mr-2" /> },
  { value: 'Negativo', label: 'Negativo', icon: <ThumbsDown className="h-4 w-4 text-red-500 mr-2" /> },
];

const ParticipantsList = ({ participants }) => (
  <Card className="glassmorphic">
    <CardHeader>
      <CardTitle className="flex items-center"><UserCheck className="mr-2 h-5 w-5 text-primary" /> Presenças Registradas</CardTitle>
      <CardDescription>Membros que registraram presença nesta missão.</CardDescription>
    </CardHeader>
    <CardContent>
      {participants.length > 0 ? (
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {participants.map(p => (
            <li key={p.members.id} className="flex items-center p-2 bg-card/50 rounded-md">
              <UserCheck className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm font-medium text-foreground">{p.members.codinome || p.members.discord_id}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma presença registrada ainda.</p>
      )}
    </CardContent>
  </Card>
);

const MissionFeedbackPage = () => {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  const [missions, setMissions] = useState([]);
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [isLoadingMissions, setIsLoadingMissions] = useState(true);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingBonus, setIsProcessingBonus] = useState(false);
  const [evaluatorMemberId, setEvaluatorMemberId] = useState(null);
  const [isLoadingEvaluator, setIsLoadingEvaluator] = useState(true);

  const fetchEvaluatorMemberId = useCallback(async () => {
    if (!user || !supabase) {
      setIsLoadingEvaluator(false);
      return;
    }
    setIsLoadingEvaluator(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;

      if (data) {
        setEvaluatorMemberId(data.id);
      } else {
        toast({
          title: "Perfil de Avaliador Inválido",
          description: "Você precisa de um perfil de membro no sistema para poder avaliar missões.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar perfil do avaliador:", error);
      toast({ title: "Erro ao carregar seu perfil de avaliador", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingEvaluator(false);
    }
  }, [supabase, user, toast]);

  useEffect(() => {
    fetchEvaluatorMemberId();
  }, [fetchEvaluatorMemberId]);

  const fetchMissions = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingMissions(true);
    const { data, error } = await supabase
      .from('missions')
      .select('id, title, date, status, coins_for_positive_feedback_bonus')
      .in('status', ['Concluída', 'Em Andamento', 'Programada']) 
      .order('date', { ascending: false });

    if (error) {
      toast({ title: "Erro ao buscar missões", description: error.message, variant: "destructive" });
    } else {
      setMissions(data || []);
    }
    setIsLoadingMissions(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const fetchParticipants = useCallback(async (missionId) => {
    if (!supabase || !missionId) return;
    setIsLoadingParticipants(true);
    setParticipants([]);
    setFeedbacks({});

    const { data: missionParticipants, error: participantsError } = await supabase
      .from('mission_participants')
      .select('id, member_id, members(id, codinome, discord_id, email)')
      .eq('mission_id', missionId);

    if (participantsError) {
      toast({ title: "Erro ao buscar participantes", description: participantsError.message, variant: "destructive" });
      setIsLoadingParticipants(false);
      return;
    }
    
    setParticipants(missionParticipants || []);

    const { data: existingFeedbacks, error: feedbacksError } = await supabase
      .from('mission_feedback')
      .select('*')
      .eq('mission_id', missionId);

    if (feedbacksError) {
      toast({ title: "Erro ao buscar feedbacks existentes", description: feedbacksError.message, variant: "destructive" });
    } else if (existingFeedbacks) {
      const initialFeedbacks = {};
      existingFeedbacks.forEach(fb => {
        const participantEntry = missionParticipants.find(p => p.members.id === fb.evaluated_member_id);
        if (participantEntry) {
          initialFeedbacks[participantEntry.members.id] = {
            type: fb.feedback_type,
            comment: fb.comment || '',
            existingFeedbackId: fb.id,
          };
        }
      });
      setFeedbacks(initialFeedbacks);
    }
    setIsLoadingParticipants(false);
  }, [supabase, toast]);

  useEffect(() => {
    if (selectedMissionId) {
      fetchParticipants(selectedMissionId);
    } else {
      setParticipants([]);
      setFeedbacks({});
    }
  }, [selectedMissionId, fetchParticipants]);

  const handleFeedbackChange = (memberId, field, value) => {
    setFeedbacks(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value,
      }
    }));
  };

  const handleSubmitFeedbacks = async () => {
    if (!supabase || !user || !selectedMissionId || participants.length === 0) return;

    if (!evaluatorMemberId) {
        toast({ title: "Ação não permitida", description: "Seu perfil de membro avaliador não foi encontrado.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);

    const feedbackPayloads = participants
      .map(p => {
        const memberId = p.members.id;
        const feedback = feedbacks[memberId];
        if (feedback && feedback.type) {
          return {
            id: feedback.existingFeedbackId,
            mission_id: selectedMissionId,
            evaluator_member_id: evaluatorMemberId,
            evaluated_member_id: memberId,
            feedback_type: feedback.type,
            comment: feedback.comment || null,
          };
        }
        return null;
      })
      .filter(Boolean);

    try {
      if (feedbackPayloads.length > 0) {
        const upsertData = feedbackPayloads.map(({ id, ...rest }) => ({ ...rest, ...(id && { id }) }));
        const { error: feedbackError } = await supabase.from('mission_feedback').upsert(upsertData, { onConflict: 'id' });
        if (feedbackError) throw feedbackError;
      }
      
      toast({ title: "Feedbacks Salvos!", description: "Os feedbacks foram registrados com sucesso." });
      fetchParticipants(selectedMissionId); // Refresh data
    } catch (error) {
      console.error("Erro ao salvar feedbacks:", error);
      toast({ title: "Erro ao salvar feedbacks", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessBonus = async () => {
    if (!selectedMissionId) return;
    setIsProcessingBonus(true);
    try {
      const { data, error } = await supabase.rpc('process_mission_feedback_and_rewards', {
        p_mission_id: selectedMissionId
      });

      if (error) throw error;
      
      if (data.success) {
        const awardedCount = data.awarded_members?.length || 0;
        toast({
          title: "Bônus Processado!",
          description: `${awardedCount} membro(s) receberam bônus de moedas. (${data.awarded_members?.join(', ') || 'Nenhum'})`,
          variant: "success"
        });
      } else {
        throw new Error(data.message || 'Ocorreu um erro desconhecido.');
      }
    } catch (error) {
      console.error("Erro ao processar bônus:", error);
      toast({ title: "Erro ao Processar Bônus", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingBonus(false);
    }
  };

  const selectedMissionInfo = missions.find(m => m.id === selectedMissionId);

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-foreground flex items-center">
          <MessageSquare className="mr-3 h-8 w-8 text-primary" /> Feedback de Missões
        </h1>
      </div>

      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle>Selecionar Missão</CardTitle>
          <CardDescription>Escolha uma missão para visualizar participantes e fornecer feedback.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMissions || isLoadingEvaluator ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <Select onValueChange={setSelectedMissionId} value={selectedMissionId} disabled={!evaluatorMemberId}>
              <SelectTrigger className="w-full md:w-1/2 input-dark">
                <SelectValue placeholder="Selecione uma missão" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {missions.length > 0 ? missions.map(mission => (
                  <SelectItem key={mission.id} value={mission.id} className="hover:bg-accent focus:bg-accent">
                    {mission.title} ({new Date(mission.date + 'T00:00:00').toLocaleDateString('pt-BR')}) - {mission.status}
                  </SelectItem>
                )) : <SelectItem value="no-missions" disabled>Nenhuma missão disponível</SelectItem>}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedMissionId && (
        isLoadingParticipants ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="ml-3 text-muted-foreground">Carregando participantes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Formulário de Feedback</h2>
              {participants.length === 0 ? (
                 <Card className="glassmorphic">
                    <CardContent className="py-10 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhum participante registrado para esta missão ainda.</p>
                    </CardContent>
                  </Card>
              ) : (
                <>
                  {participants.map(p => (
                    <Card key={p.members.id} className="glassmorphic border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg text-primary">{p.members.codinome || p.members.discord_id || p.members.email}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tipo de Feedback</label>
                          <Select
                            value={feedbacks[p.members.id]?.type || ''}
                            onValueChange={(value) => handleFeedbackChange(p.members.id, 'type', value)}
                          >
                            <SelectTrigger className="input-dark">
                              <SelectValue placeholder="Selecione o tipo de feedback" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {FEEDBACK_TYPES.map(ft => (
                                <SelectItem key={ft.value} value={ft.value} className="hover:bg-accent focus:bg-accent flex items-center">
                                  {ft.icon} {ft.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Comentário (Opcional)</label>
                          <Textarea
                            value={feedbacks[p.members.id]?.comment || ''}
                            onChange={(e) => handleFeedbackChange(p.members.id, 'comment', e.target.value)}
                            placeholder="Adicione um comentário sobre o desempenho..."
                            className="input-dark min-h-[80px]"
                          />
                        </div>
                        {feedbacks[p.members.id]?.existingFeedbackId && (
                          <p className="text-xs text-green-500">Feedback já registrado. Você pode atualizá-lo.</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  <div className="flex justify-end mt-6 gap-4">
                     <Button 
                        onClick={handleProcessBonus} 
                        disabled={isProcessingBonus || isSubmitting || !selectedMissionInfo?.coins_for_positive_feedback_bonus}
                        className="btn-secondary-dark"
                        title={!selectedMissionInfo?.coins_for_positive_feedback_bonus ? "Esta missão não tem bônus configurado." : "Processar bônus de moedas para os participantes."}
                      >
                      {isProcessingBonus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
                      {isProcessingBonus ? 'Processando Bônus...' : 'Processar Bônus de Moedas'}
                    </Button>
                    <Button onClick={handleSubmitFeedbacks} disabled={isSubmitting || Object.keys(feedbacks).length === 0} className="btn-primary-dark">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      {isSubmitting ? 'Salvando...' : 'Salvar Feedbacks'}
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="lg:col-span-1">
              <ParticipantsList participants={participants} />
            </div>
          </div>
        )
      )}
    </motion.div>
  );
};

export default MissionFeedbackPage;