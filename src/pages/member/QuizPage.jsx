import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import QuizSetup from '@/components/member/quiz/QuizSetup';
import QuestionFlow from '@/components/member/quiz/QuestionFlow';

const QuizPage = () => {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizState, setQuizState] = useState('setup'); // setup, in_progress, finished
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizSettings, setQuizSettings] = useState(null);

  const fetchMemberData = useCallback(async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, patente_atual, coins, points')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setMemberData(data);
      } else {
        toast({ title: "Perfil não encontrado", description: "Não foi possível carregar seus dados de membro.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao buscar dados do membro:", error);
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, supabase, toast]);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  const handleStartQuiz = async (settings) => {
    setLoading(true);
    setQuizSettings(settings);
    try {
      let query = supabase
        .from('quiz_questions')
        .select('*');

      if (settings.category !== 'all') {
        query = query.eq('category', settings.category);
      }
      if (settings.difficulty !== 'all') {
        query = query.eq('difficulty', settings.difficulty);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      // Embaralhar e selecionar o número de perguntas
      const shuffled = data.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, settings.numQuestions);

      if (selectedQuestions.length < settings.numQuestions) {
        toast({
          title: "Perguntas Insuficientes",
          description: `Encontramos apenas ${selectedQuestions.length} perguntas com esses filtros. O quiz começará com elas.`,
          variant: "default"
        });
      }
      
      if (selectedQuestions.length === 0) {
         toast({
          title: "Nenhuma Pergunta Encontrada",
          description: "Não há perguntas disponíveis com os filtros selecionados. Tente outras opções.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setQuizQuestions(selectedQuestions);
      setQuizState('in_progress');
    } catch (error) {
      toast({ title: "Erro ao buscar perguntas", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFinishQuiz = () => {
    setQuizState('finished');
  };
  
  const handleRestart = () => {
    setQuizQuestions([]);
    setQuizSettings(null);
    setQuizState('setup');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="mt-3 text-slate-300">Carregando...</p>
        </div>
      );
    }

    switch (quizState) {
      case 'in_progress':
        return (
          <QuestionFlow
            questions={quizQuestions}
            memberData={memberData}
            setMemberData={setMemberData}
            onFinish={handleFinishQuiz}
          />
        );
      case 'finished':
        // A tela de resultados agora é mostrada dentro do QuestionFlow no final.
        // Esta tela é para quando o fluxo todo acaba.
        return (
           <div className="text-center py-10">
            <h3 className="text-2xl font-semibold text-yellow-300 mb-3">Quiz Finalizado!</h3>
            <p className="text-slate-300 mb-6">Você completou o desafio. Verifique seus novos pontos e moedas!</p>
            <Button onClick={handleRestart} className="bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105">
              Jogar Novamente
            </Button>
          </div>
        );
      case 'setup':
      default:
        return <QuizSetup onStartQuiz={handleStartQuiz} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-background text-white p-4 sm:p-8 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="w-full max-w-3xl"
      >
        <Card className="glassmorphic-dark shadow-2xl border-primary/30">
          <CardHeader className="text-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Brain className="h-16 w-16 text-primary mx-auto mb-4 drop-shadow-[0_0_10px_hsl(var(--primary))]" />
              <CardTitle className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-primary mb-2">
                Quiz G.E.R.R
              </CardTitle>
              <CardDescription className="text-slate-400 text-lg">
                {quizState === 'in_progress' ? 'Responda com atenção!' : 'Teste seus conhecimentos e ganhe recompensas!'}
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="mt-6 min-h-[300px] flex flex-col justify-center">
            {renderContent()}
          </CardContent>
        </Card>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Button asChild variant="link" className="text-primary-light hover:text-primary transition-colors">
            <Link to="/dashboard">Voltar ao Painel Principal</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default QuizPage;