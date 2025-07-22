import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, CalendarDays, CheckCircle, XCircle, Loader2, Clock, AlertCircle, UserPlus, UserCheck, UserCircle, ThumbsUp, ThumbsDown, Star, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/components/admin/members/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const EvaluationPopover = ({ evaluations }) => {
  if (!evaluations || evaluations.length === 0) {
    return <span className="ml-2 text-xs text-muted-foreground">(0)</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="ml-2 text-xs text-muted-foreground underline cursor-pointer">({evaluations.length})</button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2">
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-foreground">Quem Avaliou</h4>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {evaluations.map(ev => (
              <li key={ev.members.id} className="flex items-center gap-2 text-xs">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={ev.members.avatar_url} alt={ev.members.codinome} />
                  <AvatarFallback>{ev.members.codinome?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">{ev.members.codinome}</span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const MissionEvaluation = ({ missionId, memberId, initialEvaluations, userEvaluation, onEvaluate, allEvaluations }) => {
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [myVote, setMyVote] = useState(userEvaluation);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setEvaluations(initialEvaluations);
    setMyVote(userEvaluation);
  }, [initialEvaluations, userEvaluation]);

  const handleEvaluation = async (type) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const oldVote = myVote;
    const newVote = oldVote === type ? null : type;

    // Optimistic UI update
    setMyVote(newVote);
    const tempEvaluations = { ...evaluations };
    if (oldVote) tempEvaluations[oldVote] = Math.max(0, tempEvaluations[oldVote] - 1);
    if (newVote) tempEvaluations[newVote] = (tempEvaluations[newVote] || 0) + 1;
    setEvaluations(tempEvaluations);

    try {
      await onEvaluate(missionId, newVote);
    } catch (error) {
      // Revert UI on error
      setMyVote(oldVote);
      setEvaluations(initialEvaluations);
    } finally {
      setIsProcessing(false);
    }
  };

  const evaluationTypes = [
    { type: 'Positivo', icon: ThumbsUp, color: 'text-green-500', hover: 'hover:bg-green-500/20' },
    { type: 'Neutro', icon: Star, color: 'text-yellow-500', hover: 'hover:bg-yellow-500/20' },
    { type: 'Negativo', icon: ThumbsDown, color: 'text-red-500', hover: 'hover:bg-red-500/20' },
  ];

  return (
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center gap-4">
        {evaluationTypes.map(({ type, icon: Icon, color, hover }) => (
          <div key={type} className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full h-8 w-8 transition-all duration-200 ${myVote === type ? `${color} bg-primary/10` : 'text-muted-foreground'} ${hover}`}
              onClick={() => handleEvaluation(type)}
              disabled={isProcessing}
            >
              <Icon className="h-4 w-4" />
            </Button>
            <span className={`text-sm font-medium ${myVote === type ? color : 'text-muted-foreground'}`}>
              {evaluations[type] || 0}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <Users className="h-4 w-4 mr-1" />
        Total:
        <EvaluationPopover evaluations={allEvaluations} />
      </div>
    </div>
  );
};

const MissionsCard = () => {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  const [missions, setMissions] = useState([]);
  const [authorsData, setAuthorsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [memberId, setMemberId] = useState(null);
  const [participatingMissions, setParticipatingMissions] = useState(new Set());
  const [processingMissionId, setProcessingMissionId] = useState(null);
  const [evaluationsData, setEvaluationsData] = useState({});

  const fetchMemberId = useCallback(async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase.from('members').select('id').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setMemberId(data.id);
    } catch (error) {
      console.error("Erro ao buscar ID do membro:", error);
    }
  }, [user, supabase]);

  const fetchMissionsAndData = useCallback(async () => {
    if (!supabase) { setIsLoading(false); return; }
    setIsLoading(true);
    
    try {
      const { data: missionsData, error: missionsError } = await supabase.from('missions').select('*').order('date', { ascending: false }).limit(10); 
      if (missionsError) throw missionsError;
      setMissions(missionsData || []);

      const userIds = [...new Set(missionsData.map(m => m.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: membersInfo, error: membersError } = await supabase.from('members').select('user_id, codinome').in('user_id', userIds);
        if (membersError) console.error("Erro ao buscar codinomes:", membersError);
        else {
          const authorsMap = membersInfo.reduce((acc, m) => { if (m.user_id) acc[m.user_id] = m.codinome; return acc; }, {});
          setAuthorsData(authorsMap);
        }
      }

      const missionIds = missionsData.map(m => m.id);
      if (missionIds.length > 0) {
        if (memberId) {
          const { data: participationData, error: participationError } = await supabase.from('mission_participants').select('mission_id').eq('member_id', memberId).in('mission_id', missionIds);
          if (participationError) throw participationError;
          setParticipatingMissions(new Set(participationData.map(p => p.mission_id)));
        }

        const { data: evalsData, error: evalsError } = await supabase.from('mission_evaluations').select('*, members(id, codinome, avatar_url)').in('mission_id', missionIds);
        if (evalsError) throw evalsError;

        const processedEvals = missionIds.reduce((acc, id) => {
          acc[id] = { counts: { Positivo: 0, Neutro: 0, Negativo: 0 }, userEvaluation: null, allEvaluations: [] };
          return acc;
        }, {});

        evalsData.forEach(ev => {
          if (processedEvals[ev.mission_id]) {
            processedEvals[ev.mission_id].counts[ev.evaluation_type]++;
            processedEvals[ev.mission_id].allEvaluations.push(ev);
            if (ev.member_id === memberId) {
              processedEvals[ev.mission_id].userEvaluation = ev.evaluation_type;
            }
          }
        });
        setEvaluationsData(processedEvals);
      }
    } catch (error) {
      console.error("Erro ao buscar missões:", error);
      toast({ title: "Erro ao carregar dados de missões", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, memberId]);

  useEffect(() => { fetchMemberId(); }, [fetchMemberId]);
  useEffect(() => { if(memberId) fetchMissionsAndData(); }, [memberId, fetchMissionsAndData]);

  const handleRegisterPresence = async (missionId) => {
    if (!memberId) { toast({ title: "Erro", description: "Não foi possível identificar seu perfil.", variant: "destructive" }); return; }
    setProcessingMissionId(missionId);
    try {
      const { error } = await supabase.from('mission_participants').insert({ mission_id: missionId, member_id: memberId, participation_date: new Date().toISOString(), registered_by_member_at: new Date().toISOString() });
      if (error) throw error;
      setParticipatingMissions(prev => new Set(prev).add(missionId));
      toast({ title: "Presença Registrada!", variant: "default" });
    } catch (error) {
      toast({ title: "Erro ao registrar presença", description: error.message, variant: "destructive" });
    } finally {
      setProcessingMissionId(null);
    }
  };

  const handleEvaluation = async (missionId, evaluationType) => {
    if (!memberId) { toast({ title: "Erro", description: "Não foi possível identificar seu perfil.", variant: "destructive" }); throw new Error("Member ID not found"); }
    try {
      if (evaluationType === null) {
        const { error } = await supabase.from('mission_evaluations').delete().match({ mission_id: missionId, member_id: memberId });
        if (error) throw error;
        toast({ title: "Voto removido", variant: "default" });
      } else {
        const { error } = await supabase.from('mission_evaluations').upsert({ mission_id: missionId, member_id: memberId, evaluation_type: evaluationType }, { onConflict: 'mission_id, member_id' });
        if (error) throw error;
        toast({ title: "Avaliação registrada!", variant: "default" });
      }
      // Re-fetch to get the most up-to-date state including popover data
      await fetchMissionsAndData(); 
    } catch (error) {
      toast({ title: "Erro ao avaliar", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const getStatusIcon = (status) => ({ "Programada": <Clock className="h-4 w-4" />, "Em Andamento": <Loader2 className="h-4 w-4 animate-spin" />, "Concluída": <CheckCircle className="h-4 w-4" />, "Cancelada": <XCircle className="h-4 w-4" /> }[status] || <AlertCircle className="h-4 w-4" />);
  const getStatusClass = (status) => ({ "Programada": "bg-blue-600 text-white", "Em Andamento": "bg-yellow-500 text-black", "Concluída": "bg-green-600 text-white", "Cancelada": "bg-red-600 text-white" }[status] || "bg-gray-500 text-white");
  const getAuthorDisplay = (mission) => authorsData[mission.user_id] || mission.user_email || 'Comando';

  if (isLoading) {
    return (
      <Card className="glassmorphic border-primary/30 h-full">
        <CardHeader><CardTitle className="text-xl text-primary-foreground/90 flex items-center"><Target className="mr-2 h-6 w-6 text-primary"/>Missões e Operações</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 text-primary animate-spin" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphic border-primary/30 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl text-primary-foreground/90 flex items-center"><Target className="mr-2 h-6 w-6 text-primary"/>Missões e Operações</CardTitle>
        <CardDescription>Participe das próximas atividades e ganhe recompensas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto flex-grow custom-scrollbar pr-2">
        {missions.length === 0 ? (
          <div className="text-center py-8 flex flex-col items-center justify-center h-full">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3"/><p className="text-muted-foreground">Nenhuma missão programada.</p>
          </div>
        ) : (
          <AnimatePresence>
            {missions.map((mission, index) => (
              <motion.div key={mission.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="p-4 bg-card/60 rounded-lg border border-primary/20 shadow-sm hover:shadow-primary/10 transition-shadow space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-primary text-base line-clamp-1">{mission.title}</h4>
                  <div className={`flex items-center text-xs px-2 py-1 rounded-full font-bold ${getStatusClass(mission.status)}`}>{getStatusIcon(mission.status)}<span className="ml-1">{mission.status}</span></div>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{mission.description}</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-muted-foreground gap-2 pt-2 border-t border-primary/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-x-3">
                    <span className="flex items-center"><CalendarDays className="mr-1 h-3 w-3" />{formatDate(mission.date)}</span>
                    <span className="flex items-center mt-1 sm:mt-0"><UserCircle className="mr-1 h-3 w-3" /> Por: {getAuthorDisplay(mission)}</span>
                  </div>
                  {mission.status === "Programada" && memberId && (
                    participatingMissions.has(mission.id) ? (
                      <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-400 self-end sm:self-center" disabled><UserCheck className="mr-1 h-4 w-4" /> Inscrito</Button>
                    ) : (
                      <Button variant="outline" size="sm" className="text-primary hover:bg-primary/10 hover:text-primary-light border-primary/50 self-end sm:self-center" onClick={() => handleRegisterPresence(mission.id)} disabled={processingMissionId === mission.id}>
                        {processingMissionId === mission.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />} Registrar Presença
                      </Button>
                    )
                  )}
                </div>
                {mission.status === "Concluída" && memberId && evaluationsData[mission.id] && (
                  <div className="pt-2 border-t border-primary/10">
                    <MissionEvaluation 
                      missionId={mission.id}
                      memberId={memberId}
                      initialEvaluations={evaluationsData[mission.id].counts}
                      userEvaluation={evaluationsData[mission.id].userEvaluation}
                      onEvaluate={handleEvaluation}
                      allEvaluations={evaluationsData[mission.id].allEvaluations}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default MissionsCard;