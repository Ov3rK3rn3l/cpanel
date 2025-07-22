import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        .limit(10);

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
    const interval = setInterval(fetchRanking, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, [fetchRanking]);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-yellow-600" />;
    return <span className="font-bold text-sm w-5 text-center">{index + 1}</span>;
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
    <Card className="glassmorphic border-primary/30 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
          <Trophy className="mr-2 h-6 w-6 text-primary"/>
          Ranking de Pontos
        </CardTitle>
        <CardDescription>Veja a classificação geral dos membros.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 max-h-80 overflow-y-auto flex-grow pr-2">
        {ranking.length === 0 ? (
          <div className="text-center py-8 flex flex-col items-center justify-center h-full">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
            <p className="text-muted-foreground">O ranking ainda está sendo formado.</p>
            <p className="text-xs text-muted-foreground mt-1">Participe das atividades para pontuar!</p>
          </div>
        ) : (
          <AnimatePresence>
            {ranking.map((member, index) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
                className={`p-3 bg-card/60 rounded-lg border flex items-center gap-4 transition-all duration-300
                  ${member.id === currentMemberId 
                    ? 'border-primary shadow-lg shadow-primary/20 scale-105' 
                    : 'border-primary/20 hover:bg-primary/10'
                  }`}
              >
                <div className="w-8 text-center flex items-center justify-center">
                  {getRankIcon(index)}
                </div>
                <div className="w-10 h-10 bg-card/80 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-primary/30">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.codinome} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-primary text-sm truncate">{member.codinome}</h4>
                  <p className="text-xs text-muted-foreground truncate">{member.patente_atual}</p>
                </div>
                <div className="flex items-center font-bold text-lg text-purple-400 flex-shrink-0">
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