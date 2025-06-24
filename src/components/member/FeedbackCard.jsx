import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Star, ThumbsUp, ThumbsDown, Loader2, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/components/admin/members/utils';

const FeedbackCard = ({ memberData }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMemberFeedbacks = useCallback(async () => {
    if (!supabase || !memberData?.id) return;
    setIsLoading(true);
    
    try {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('mission_feedback')
        .select(`
          *,
          missions!inner(title, date),
          evaluator_member:evaluator_member_id(codinome)
        `)
        .eq('evaluated_member_id', memberData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (feedbackError) throw feedbackError;
      setFeedbacks(feedbackData || []);
    } catch (error) {
      console.error("Erro ao buscar feedbacks:", error);
      toast({ title: "Erro ao carregar feedbacks", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, memberData?.id, toast]);

  useEffect(() => {
    fetchMemberFeedbacks();
  }, [fetchMemberFeedbacks]);

  const getFeedbackIcon = (type) => {
    switch (type) {
      case "Positivo": return <ThumbsUp className="h-4 w-4 text-green-400" />;
      case "Negativo": return <ThumbsDown className="h-4 w-4 text-red-400" />;
      case "Neutro": return <MessageSquare className="h-4 w-4 text-yellow-400" />;
      default: return <Star className="h-4 w-4 text-blue-400" />;
    }
  };

  const getFeedbackColor = (type) => {
    switch (type) {
      case "Positivo": return "text-green-400 bg-green-900/30 border-green-500/30";
      case "Negativo": return "text-red-400 bg-red-900/30 border-red-500/30";
      case "Neutro": return "text-yellow-400 bg-yellow-900/30 border-yellow-500/30";
      default: return "text-blue-400 bg-blue-900/30 border-blue-500/30";
    }
  };

  if (isLoading) {
    return (
      <Card className="glassmorphic border-primary/30 h-full">
        <CardHeader>
          <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
            <MessageSquare className="mr-2 h-6 w-6 text-primary"/>
            Seus Feedbacks de Missões
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
          <MessageSquare className="mr-2 h-6 w-6 text-primary"/>
          Seus Feedbacks de Missões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-80 overflow-y-auto">
        {feedbacks.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
            <p className="text-muted-foreground">Nenhum feedback recebido ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Participe de missões para receber avaliações!</p>
          </div>
        ) : (
          <AnimatePresence>
            {feedbacks.map((feedback, index) => (
              <motion.div
                key={feedback.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${getFeedbackColor(feedback.feedback_type)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    {getFeedbackIcon(feedback.feedback_type)}
                    <span className="ml-2 font-semibold text-sm">{feedback.feedback_type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(feedback.created_at)}
                  </span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <Target className="mr-1 h-3 w-3" />
                  Missão: {feedback.missions?.title || 'N/A'}
                  {feedback.missions?.date && (
                    <span className="ml-2">
                      ({new Date(feedback.missions.date + 'T00:00:00').toLocaleDateString('pt-BR')})
                    </span>
                  )}
                </div>
                {feedback.comment && (
                  <p className="text-sm text-foreground/90 line-clamp-3 mb-2">"{feedback.comment}"</p>
                )}
                <div className="text-xs text-muted-foreground">
                  Avaliado por: {feedback.evaluator_member?.codinome || 'Comando'}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackCard;