import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, HelpCircle, CheckCircle, XCircle, Coins, Brain, Award, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PATENTE_ORDER_MAP, PROMOTION_PATENTS } from '@/components/admin/members/utils';
import { Link } from 'react-router-dom';

const COINS_PER_PATENTE_GROUP = {
  DEFAULT: 2,
  RESERVISTA: 5,
  RECRUTA: 8,
  SOLDADO: 10,
  CABO: 15,
  SARGENTO_BAIXO: 25,
  SARGENTO_MEDIO: 27,
  SARGENTO_ALTO: 29,
  SUBTENENTE: 35,
  OFICIAL_ALUNO_ASPIRANTE: 50,
  TENENTE_BAIXO: 60,
  TENENTE_ALTO: 65,
  CAPITAO: 80,
};

const getCoinsForPatente = (patenteAtual) => {
  if (!patenteAtual) return COINS_PER_PATENTE_GROUP.DEFAULT;

  if (patenteAtual === "Reservista") return COINS_PER_PATENTE_GROUP.RESERVISTA;
  if (patenteAtual === "Recruta") return COINS_PER_PATENTE_GROUP.RECRUTA;
  if (["Sd 2ª Classe", "Sd 1ª Classe"].includes(patenteAtual)) return COINS_PER_PATENTE_GROUP.SOLDADO;
  if (patenteAtual === "Cabo") return COINS_PER_PATENTE_GROUP.CABO;
  if (patenteAtual === "3º Sgt") return COINS_PER_PATENTE_GROUP.SARGENTO_BAIXO;
  if (patenteAtual === "2º Sgt") return COINS_PER_PATENTE_GROUP.SARGENTO_MEDIO;
  if (patenteAtual === "1º Sgt") return COINS_PER_PATENTE_GROUP.SARGENTO_ALTO;
  if (patenteAtual === "SubTenente") return COINS_PER_PATENTE_GROUP.SUBTENENTE;
  if (["Aluno-Oficial", "Aspirante a Oficial"].includes(patenteAtual)) return COINS_PER_PATENTE_GROUP.OFICIAL_ALUNO_ASPIRANTE;
  if (patenteAtual === "2º Tenente") return COINS_PER_PATENTE_GROUP.TENENTE_BAIXO;
  if (patenteAtual === "1º Tenente") return COINS_PER_PATENTE_GROUP.TENENTE_ALTO;
  if (patenteAtual === "Capitão") return COINS_PER_PATENTE_GROUP.CAPITAO;
  
  return COINS_PER_PATENTE_GROUP.DEFAULT;
};


const QuizPage = () => {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  const [memberData, setMemberData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [quizStatus, setQuizStatus] = useState('loading'); // loading, available, completed, no_questions

  const fetchMemberData = useCallback(async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, patente_atual, coins')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setMemberData(data);
      } else {
        toast({ title: "Perfil não encontrado", description: "Não foi possível carregar seus dados de membro.", variant: "destructive" });
        setQuizStatus('error');
      }
    } catch (error) {
      console.error("Erro ao buscar dados do membro:", error);
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
      setQuizStatus('error');
    } finally {
      setLoading(false);
    }
  }, [user, supabase, toast]);

  const fetchQuestion = useCallback(async () => {
    if (!supabase || !memberData || !memberData.patente_atual) {
        setQuizStatus('error');
        return;
    }
    setLoadingQuestion(true);
    setShowResult(false);
    setSelectedOptionIndex(null);
    setCurrentQuestion(null);

    try {
      // 1. Verificar se o membro já completou o quiz para a patente atual
      const { data: answeredForPatente, error: answeredError } = await supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact' })
        .eq('member_id', memberData.id)
        .eq('patente_at_attempt', memberData.patente_atual);

      if (answeredError) throw answeredError;

      if (answeredForPatente.length > 0) {
        setQuizStatus('completed');
        setLoadingQuestion(false);
        return;
      }

      // 2. Se não completou, buscar uma pergunta para a patente atual
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('required_patente', memberData.patente_atual)
        .limit(100); // Pega um lote para aleatorizar no cliente

      if (questionsError) throw questionsError;

      if (questions && questions.length > 0) {
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        setCurrentQuestion(randomQuestion);
        setQuizStatus('available');
      } else {
        setQuizStatus('no_questions');
        setCurrentQuestion(null);
      }

    } catch (error) {
      console.error("Erro ao buscar pergunta:", error);
      toast({ title: "Erro ao carregar pergunta", description: error.message, variant: "destructive" });
      setQuizStatus('error');
    } finally {
      setLoadingQuestion(false);
    }
  }, [supabase, toast, memberData]);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  useEffect(() => {
    if (memberData) {
      fetchQuestion();
    }
  }, [memberData, fetchQuestion]);

  const handleOptionSelect = (index) => {
    if (showResult) return;
    setSelectedOptionIndex(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedOptionIndex === null || !currentQuestion || !memberData) return;

    const selectedOpt = currentQuestion.options[selectedOptionIndex];
    const correct = selectedOpt.isCorrect;
    setIsCorrect(correct);

    let earned = 0;
    if (correct) {
      earned = getCoinsForPatente(memberData.patente_atual);
    }
    setCoinsEarned(earned);

    try {
      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          member_id: memberData.id,
          question_id: currentQuestion.id,
          selected_option_index: selectedOptionIndex,
          is_correct: correct,
          coins_earned: earned,
          patente_at_attempt: memberData.patente_atual, // Salva a patente no momento da tentativa
        });
      if (attemptError) throw attemptError;

      if (earned > 0) {
        const { error: coinError } = await supabase.rpc('increment_member_coins', {
          member_id_param: memberData.id,
          coins_to_add: earned
        });
        if (coinError) throw coinError;
        setMemberData(prev => ({ ...prev, coins: (prev.coins || 0) + earned }));
      }
      setShowResult(true);
    } catch (error) {
      console.error("Erro ao submeter resposta:", error);
      toast({ title: "Erro ao salvar resposta", description: error.message, variant: "destructive" });
    }
  };

  const renderContent = () => {
    switch (quizStatus) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="mt-3 text-slate-300">Verificando seu status no Quiz...</p>
          </div>
        );
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
        if (loadingQuestion) {
            return (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="mt-3 text-slate-300">Carregando pergunta...</p>
              </div>
            );
        }
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
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="question"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-2xl font-semibold text-slate-100 mb-6 text-center leading-tight">{currentQuestion.question_text}</h2>
                <div className="space-y-4">
                  {currentQuestion.options.map((option, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index + 0.3 }}
                    >
                      <Button
                        variant={selectedOptionIndex === index ? "default" : "outline"}
                        className={`w-full justify-start text-left py-6 text-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02]
                          ${selectedOptionIndex === index 
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary-light shadow-lg' 
                            : 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/70 text-slate-200 hover:text-white'
                          }`}
                        onClick={() => handleOptionSelect(index)}
                      >
                        <span className={`mr-3 h-6 w-6 rounded-full flex items-center justify-center border-2 
                          ${selectedOptionIndex === index ? 'border-primary-light bg-white text-primary' : 'border-slate-500 text-slate-400'}`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        {option.text}
                      </Button>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-10 flex justify-center"
                >
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOptionIndex === null}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-10 text-xl rounded-lg shadow-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-500"
                  >
                    Confirmar Resposta
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
                className="text-center p-6 rounded-lg"
              >
                {isCorrect ? (
                  <>
                    <CheckCircle className="h-24 w-24 text-green-400 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                    <h3 className="text-4xl font-bold text-green-300 mb-3">Correto!</h3>
                    <p className="text-xl text-slate-200 mb-2">Você mandou bem, Comandante!</p>
                    <div className="flex items-center justify-center text-2xl text-yellow-400 font-semibold my-5">
                      <Coins className="mr-2 h-8 w-8" /> +{coinsEarned} Moedas
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-24 w-24 text-red-400 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]" />
                    <h3 className="text-4xl font-bold text-red-300 mb-3">Incorreto!</h3>
                    <p className="text-xl text-slate-200 mb-2">Mais sorte na próxima vez. Continue estudando!</p>
                    {currentQuestion.options.find(opt => opt.isCorrect) && (
                       <p className="text-md text-slate-400 mt-4">A resposta correta era: <strong className="text-green-400">{currentQuestion.options.find(opt => opt.isCorrect).text}</strong></p>
                    )}
                  </>
                )}
                <Button
                  onClick={() => setQuizStatus('completed')}
                  className="mt-10 bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-8 text-lg rounded-lg shadow-lg transition-transform transform hover:scale-105"
                >
                  Finalizar Quiz
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <HelpCircle className="h-12 w-12 text-slate-500 mb-4" />
            <p className="text-slate-400 text-lg">Ocorreu um erro ao carregar o quiz.</p>
            <Button onClick={fetchMemberData} className="mt-6">Tentar Novamente</Button>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl">Carregando dados do Quiz...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-background text-white p-4 sm:p-8 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="w-full max-w-2xl"
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
                Teste seus conhecimentos e ganhe moedas!
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="mt-6">
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