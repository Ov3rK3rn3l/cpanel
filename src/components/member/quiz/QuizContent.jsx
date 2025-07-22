import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, HelpCircle, Award, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import QuestionView from './QuestionView';

const QuizContent = ({ memberData, setMemberData, quizStatus, setQuizStatus }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);

  const fetchQuestion = useCallback(async () => {
    if (!supabase || !memberData?.patente_atual) {
      setQuizStatus('error');
      return;
    }
    setLoadingQuestion(true);
    setCurrentQuestion(null);

    try {
      const { data: answeredForPatente, error: answeredError } = await supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact' })
        .eq('member_id', memberData.id)
        .eq('patente_at_attempt', memberData.patente_atual);

      if (answeredError) throw answeredError;

      if (answeredForPatente.length > 0) {
        setQuizStatus('completed');
        return;
      }

      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('required_patente', memberData.patente_atual)
        .limit(100);

      if (questionsError) throw questionsError;

      if (questions && questions.length > 0) {
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        setCurrentQuestion(randomQuestion);
        setQuizStatus('available');
      } else {
        setQuizStatus('no_questions');
      }
    } catch (error) {
      console.error("Erro ao buscar pergunta:", error);
      toast({ title: "Erro ao carregar pergunta", description: error.message, variant: "destructive" });
      setQuizStatus('error');
    } finally {
      setLoadingQuestion(false);
    }
  }, [supabase, toast, memberData, setQuizStatus]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  if (loadingQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="mt-3 text-slate-300">Carregando pergunta...</p>
      </div>
    );
  }

  switch (quizStatus) {
    case 'completed':
      return (
        <div className="text-center py-10">
          <Award className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-yellow-300 mb-3">Quiz Concluído!</h3>
          <p className="text-slate-300 mb-6">Você já completou o quiz para sua patente atual ({memberData.patente_atual}). Aguarde a próxima promoção para novos desafios!</p>
          <Button asChild className="bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105">
            <Link to="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      );
    case 'no_questions':
      return (
        <div className="text-center py-10">
          <Lock className="h-20 w-20 text-slate-500 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-slate-400 mb-3">Quiz Indisponível</h3>
          <p className="text-slate-300 mb-6">Ainda não há um quiz disponível para sua patente ({memberData.patente_atual}). Fique atento para futuras atualizações!</p>
          <Button asChild className="bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105">
            <Link to="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      );
    case 'available':
      if (!currentQuestion) {
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <HelpCircle className="h-12 w-12 text-slate-500 mb-4" />
            <p className="text-slate-400 text-lg">Não foi possível carregar a pergunta.</p>
            <Button onClick={fetchQuestion} className="mt-6">Tentar Novamente</Button>
          </div>
        );
      }
      return (
        <QuestionView 
          question={currentQuestion}
          memberData={memberData}
          setMemberData={setMemberData}
          onComplete={() => setQuizStatus('completed')}
        />
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <HelpCircle className="h-12 w-12 text-slate-500 mb-4" />
          <p className="text-slate-400 text-lg">Ocorreu um erro inesperado.</p>
          <Button onClick={fetchQuestion} className="mt-6">Tentar Novamente</Button>
        </div>
      );
  }
};

export default QuizContent;