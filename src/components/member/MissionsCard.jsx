import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, CalendarDays, CheckCircle, XCircle, Loader2, Clock, AlertCircle, UserPlus, UserCheck, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/components/admin/members/utils';

const MissionsCard = () => {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  const [missions, setMissions] = useState([]);
  const [authorsData, setAuthorsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [memberId, setMemberId] = useState(null);
  const [participatingMissions, setParticipatingMissions] = useState(new Set());
  const [processingMissionId, setProcessingMissionId] = useState(null);

  const fetchMemberId = useCallback(async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setMemberId(data.id);
    } catch (error) {
      console.error("Erro ao buscar ID do membro:", error);
    }
  }, [user, supabase]);

  const fetchMissionsAndData = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    
    try {
      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select('*')
        .order('date', { ascending: false })
        .limit(10); 

      if (missionsError) throw missionsError;
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

      if (memberId) {
        const missionIds = missionsData.map(m => m.id);
        if (missionIds.length > 0) {
          const { data: participationData, error: participationError } = await supabase
            .from('mission_participants')
            .select('mission_id')
            .eq('member_id', memberId)
            .in('mission_id', missionIds);

          if (participationError) throw participationError;
          setParticipatingMissions(new Set(participationData.map(p => p.mission_id)));
        }
      }

    } catch (error) {
      console.error("Erro ao buscar missões ou participações:", error);
      toast({ title: "Erro ao carregar dados de missões", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, memberId]);

  useEffect(() => {
    fetchMemberId();
  }, [fetchMemberId]);

  useEffect(() => {
    fetchMissionsAndData();
  }, [memberId, fetchMissionsAndData]);

  const handleRegisterPresence = async (missionId) => {
    if (!memberId) {
      toast({ title: "Erro", description: "Não foi possível identificar seu perfil de membro.", variant: "destructive" });
      return;
    }
    setProcessingMissionId(missionId);
    try {
      const { error } = await supabase
        .from('mission_participants')
        .insert({
          mission_id: missionId,
          member_id: memberId,
          participation_date: new Date().toISOString(),
          registered_by_member_at: new Date().toISOString()
        });

      if (error) throw error;

      setParticipatingMissions(prev => new Set(prev).add(missionId));
      toast({ title: "Presença Registrada!", description: "Você marcou presença na missão.", variant: "default" });
    } catch (error) {
      console.error("Erro ao registrar presença:", error);
      toast({ title: "Erro ao registrar presença", description: error.message, variant: "destructive" });
    } finally {
      setProcessingMissionId(null);
    }
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case "Programada": return <Clock className="h-4 w-4 text-blue-400" />;
      case "Em Andamento": return <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />;
      case "Concluída": return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "Cancelada": return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Programada": return "text-blue-400 bg-blue-900/30";
      case "Em Andamento": return "text-yellow-400 bg-yellow-900/30";
      case "Concluída": return "text-green-400 bg-green-900/30";
      case "Cancelada": return "text-red-400 bg-red-900/30";
      default: return "text-gray-400 bg-gray-900/30";
    }
  };
  
  const getAuthorDisplay = (mission) => {
    return authorsData[mission.user_id] || mission.user_email || 'Comando';
  };

  if (isLoading) {
    return (
      <Card className="glassmorphic border-primary/30 h-full">
        <CardHeader>
          <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
            <Target className="mr-2 h-6 w-6 text-primary"/>
            Missões e Operações
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphic border-primary/30 h-full">
      <CardHeader>
        <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
          <Target className="mr-2 h-6 w-6 text-primary"/>
          Missões e Operações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {missions.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
            <p className="text-muted-foreground">Nenhuma missão programada.</p>
          </div>
        ) : (
          <AnimatePresence>
            {missions.map((mission, index) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-card/60 rounded-lg border border-primary/20 shadow-sm hover:shadow-primary/10 transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-primary text-sm line-clamp-1">{mission.title}</h4>
                  <div className={`flex items-center text-xs px-2 py-1 rounded-full ${getStatusColor(mission.status)}`}>
                    {getStatusIcon(mission.status)}
                    <span className="ml-1">{mission.status}</span>
                  </div>
                </div>
                <p className="text-sm text-foreground/90 line-clamp-2 mb-2">{mission.description}</p>
                 <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-x-3">
                    <span className="flex items-center"><CalendarDays className="mr-1 h-3 w-3" />{formatDate(mission.date)}</span>
                    <span className="flex items-center mt-1 sm:mt-0"><UserCircle className="mr-1 h-3 w-3" /> Por: {getAuthorDisplay(mission)}</span>
                  </div>
                  {mission.status === "Programada" && memberId && (
                    participatingMissions.has(mission.id) ? (
                      <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-400" disabled>
                        <UserCheck className="mr-1 h-4 w-4" /> Inscrito
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-primary hover:bg-primary/10 hover:text-primary-light border-primary/50"
                        onClick={() => handleRegisterPresence(mission.id)}
                        disabled={processingMissionId === mission.id}
                      >
                        {processingMissionId === mission.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />}
                        Registrar Presença
                      </Button>
                    )
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default MissionsCard;