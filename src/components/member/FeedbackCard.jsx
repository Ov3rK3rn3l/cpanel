import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown, Star, User, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const FeedbackIcon = ({ type }) => {
  switch (type) {
    case 'Positivo':
      return <ThumbsUp className="h-5 w-5 text-green-500" />;
    case 'Negativo':
      return <ThumbsDown className="h-5 w-5 text-red-500" />;
    case 'Neutro':
      return <Star className="h-5 w-5 text-yellow-500" />;
    default:
      return <MessageSquare className="h-5 w-5 text-gray-500" />;
  }
};

const FeedbackCard = ({ memberData }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = useCallback(async () => {
    if (!memberData || !memberData.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mission_feedback')
        .select(`
          *,
          mission:mission_id (title),
          evaluator:evaluator_member_id (codinome, avatar_url)
        `)
        .eq('evaluated_member_id', memberData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      toast({
        title: "Erro ao buscar feedbacks",
        description: "Não foi possível carregar seus feedbacks recebidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast, memberData]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  return (
    <Card className="glassmorphic border-primary/30 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl text-primary-foreground/90 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Seus Feedbacks de Missões
        </CardTitle>
        <CardDescription>Avaliações recebidas da liderança em missões.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </motion.div>
          ) : feedbacks.length === 0 ? (
            <motion.div key="no-feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground p-4">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p className="font-semibold text-lg">Nenhum feedback recebido ainda.</p>
              <p className="text-sm">Participe de missões para receber avaliações!</p>
            </motion.div>
          ) : (
            <motion.div key="feedback-list" className="space-y-4">
              {feedbacks.map((feedback, index) => (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-secondary/50 border-l-4"
                  style={{ borderColor: feedback.feedback_type === 'Positivo' ? '#22c55e' : feedback.feedback_type === 'Negativo' ? '#ef4444' : '#eab308' }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <FeedbackIcon type={feedback.feedback_type} />
                      <h4 className="font-semibold text-primary-foreground">{feedback.mission.title}</h4>
                    </div>
                    <Badge variant={
                      feedback.feedback_type === 'Positivo' ? 'success' :
                      feedback.feedback_type === 'Negativo' ? 'destructive' :
                      'warning'
                    }>
                      {feedback.feedback_type}
                    </Badge>
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-foreground/80 mt-2 pl-8 italic">"{feedback.comment}"</p>
                  )}
                  <div className="flex justify-end items-center text-xs text-muted-foreground mt-3 gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{feedback.evaluator?.codinome || 'Avaliador'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default FeedbackCard;