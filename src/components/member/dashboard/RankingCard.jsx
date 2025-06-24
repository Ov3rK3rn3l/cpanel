import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Loader2, Shield, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const RankingCard = ({ currentMemberId }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, codinome, patente_atual, points, avatar_url')
        .neq('status', 'Desligado')
        .is('data_saida', null)
        .order('points', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRanking(data || []);
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
      toast({ title: "Erro ao carregar o ranking", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchRanking();
    const interval = setInterval(fetchRanking, 60000);
    return () => clearInterval(interval);
  }, [fetchRanking]);

  const getRankColor = (index) => {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-yellow-600';
    return 'text-primary-foreground/80';
  };

  if (isLoading) {
    return (
      <Card className="glassmorphic border-primary/30 h-full">
        <CardHeader>
          <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
            <Trophy className="mr-2 h-6 w-6 text-primary"/>
            Ranking de Pontos
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
          <Trophy className="mr-2 h-6 w-6 text-primary"/>
          Ranking de Pontos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-80 overflow-y-auto">
        {ranking.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
            <p className="text-muted-foreground">O ranking ainda está sendo formado.</p>
            <p className="text-xs text-muted-foreground mt-1">Participe das atividades para pontuar!</p>
          </div>
        ) : (
          <AnimatePresence>
            {ranking.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 bg-card/60 rounded-lg border ${member.id === currentMemberId ? 'border-primary' : 'border-primary/20'} flex items-center gap-4`}
              >
                <div className={`w-8 text-center font-bold text-2xl ${getRankColor(index)}`}>
                  {index + 1}
                </div>
                <div className="w-12 h-12 bg-card/80 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.codinome} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold text-primary text-sm truncate">{member.codinome}</h4>
                  <p className="text-xs text-muted-foreground">{member.patente_atual}</p>
                </div>
                <div className="flex items-center font-bold text-lg text-purple-400">
                  <Award className="mr-1 h-4 w-4" />
                  {member.points}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingCard;