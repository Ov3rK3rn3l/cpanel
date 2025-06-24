import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MessageSquare, Users, Send, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
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
      
      if (error) {
        throw error;
      }

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
      .select('id, title, date, status, coins_for_presence, coins_for_positive_feedback_bonus')
      .in('status', ['Concluída', 'Em Andamento']) 
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

    const selectedMission = missions.find(m => m.id === selectedMissionId);
    if (!selectedMission) {
        toast({ title: "Erro", description: "Missão selecionada não encontrada.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const feedbackPayloads = [];
    const memberCoinUpdates = {};

    participants.forEach(p => {
      const memberId = p.members.id;
      const feedback = feedbacks[memberId];
      if (feedback && feedback.type) {
        feedbackPayloads.push({
          id: feedback.existingFeedbackId, 
          mission_id: selectedMissionId,
          evaluator_member_id: evaluatorMemberId, 
          evaluated_member_id: memberId,
          feedback_type: feedback.type,
          comment: feedback.comment || null,
        });
      }
      
      memberCoinUpdates[memberId] = (memberCoinUpdates[memberId] || 0) + (selectedMission.coins_for_presence || 0);
    });

    try {
      if (feedbackPayloads.length > 0) {
        const upsertData = feedbackPayloads.map(({ id, ...rest }) => ({ ...rest, ...(id && { id }) }));
        const { error: feedbackError } = await supabase.from('mission_feedback').upsert(upsertData, { onConflict: 'id' });
        if (feedbackError) throw feedbackError;
      }

      const positiveFeedbackCounts = {};
      const totalFeedbackCounts = {};

      feedbackPayloads.forEach(fb => {
        totalFeedbackCounts[fb.evaluated_member_id] = (totalFeedbackCounts[fb.evaluated_member_id] || 0) + 1;
        if (fb.feedback_type === 'Positivo') {
          positiveFeedbackCounts[fb.evaluated_member_id] = (positiveFeedbackCounts[fb.evaluated_member_id] || 0) + 1;
        }
      });
      
      const missionParticipantUpdates = [];
      for (const memberId in totalFeedbackCounts) {
        const positivePercentage = (positiveFeedbackCounts[memberId] || 0) / totalFeedbackCounts[memberId];
        let feedbackBonus = 0;
        if (positivePercentage >= 0.5) {
          feedbackBonus = selectedMission.coins_for_positive_feedback_bonus || 0;
          memberCoinUpdates[memberId] = (memberCoinUpdates[memberId] || 0) + feedbackBonus;
        }
        const participantEntry = participants.find(p => p.members.id === memberId);
        if(participantEntry) {
            missionParticipantUpdates.push({
                id: participantEntry.id,
                mission_id: selectedMissionId,
                member_id: memberId,
                coins_earned_presence: selectedMission.coins_for_presence || 0,
                coins_earned_feedback_bonus: feedbackBonus
            });
        }
      }

      if (missionParticipantUpdates.length > 0) {
          const { error: participantUpdateError } = await supabase
            .from('mission_participants')
            .upsert(missionParticipantUpdates, { onConflict: 'id' });
          if (participantUpdateError) throw participantUpdateError;
      }

      for (const memberId in memberCoinUpdates) {
        if (memberCoinUpdates[memberId] > 0) {
          const { error: coinError } = await supabase.rpc('increment_member_coins', {
            member_id_param: memberId,
            coins_to_add: memberCoinUpdates[memberId]
          });
          if (coinError) {
            console.error(`Erro ao atualizar moedas para membro ${memberId}:`, coinError);
          }
        }
      }

      toast({ title: "Feedbacks Salvos!", description: "Os feedbacks e moedas foram processados." });
      fetchParticipants(selectedMissionId);
    } catch (error) {
      console.error("Erro ao salvar feedbacks:", error);
      toast({ title: "Erro ao salvar feedbacks", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <SelectValue placeholder="Selecione uma missão concluída ou em andamento" />
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
        ) : participants.length === 0 ? (
          <Card className="glassmorphic">
            <CardContent className="py-10 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum participante registrado para esta missão ainda.</p>
              <p className="text-xs text-muted-foreground">Adicione participantes na seção de gerenciamento de missões.</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Participantes da Missão</h2>
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
            <div className="flex justify-end mt-6">
              <Button onClick={handleSubmitFeedbacks} disabled={isSubmitting || Object.keys(feedbacks).length === 0} className="btn-primary-dark">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Salvando...' : 'Salvar Feedbacks e Distribuir Moedas'}
              </Button>
            </div>
          </motion.div>
        )
      )}
    </motion.div>
  );
};

export default MissionFeedbackPage;