
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Coins, Award, ArrowRight, Trophy } from 'lucide-react';

const COINS_PER_CORRECT_ANSWER = 5;
const POINTS_PER_CORRECT_ANSWER = 10;

const QuestionFlow = ({ questions, memberData, setMemberData, onFinish }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0, coins: 0, points: 0 });
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (index) => {
    if (showResult || isSubmitting) return;
    setSelectedOptionIndex(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedOptionIndex === null) return;
    setIsSubmitting(true);

    const selectedOpt = currentQuestion.options[selectedOptionIndex];
    const correct = selectedOpt.isCorrect;
    setIsCorrect(correct);

    let earnedCoins = 0;
    let earnedPoints = 0;

    if (correct) {
      earnedCoins = COINS_PER_CORRECT_ANSWER;
      earnedPoints = POINTS_PER_CORRECT_ANSWER;
      setScore(prev => ({
        ...prev,
        correct: prev.correct + 1,
        coins: prev.coins + earnedCoins,
        points: prev.points + earnedPoints,
      }));
    } else {
      setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }

    try {
      await supabase.from('quiz_attempts').insert({
        member_id: memberData.id,
        question_id: currentQuestion.id,
        selected_option_index: selectedOptionIndex,
        is_correct: correct,
        coins_earned: earnedCoins,
        patente_at_attempt: memberData.patente_atual,
      });

      if (earnedCoins > 0) {
        await supabase.rpc('increment_member_coins', { member_id_param: memberData.id, coins_to_add: earnedCoins });
        setMemberData(prev => ({ ...prev, coins: (prev.coins || 0) + earnedCoins }));
      }
      if (earnedPoints > 0) {
        await supabase.rpc('increment_member_points', { p_member_id: memberData.id, p_points_to_add: earnedPoints });
        setMemberData(prev => ({ ...prev, points: (prev.points || 0) + earnedPoints }));
      }

      setShowResult(true);
    } catch (error) {
      console.error("Erro ao submeter resposta:", error);
      toast({ title: "Erro ao salvar resposta", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setShowResult(false);
    setSelectedOptionIndex(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const renderQuestion = () => (
    <motion.div
      key={`question-${currentQuestionIndex}`}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-4 text-center text-slate-400">
        Pergunta {currentQuestionIndex + 1} de {questions.length}
      </div>
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
              disabled={isSubmitting}
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
          disabled={selectedOptionIndex === null || isSubmitting}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-10 text-xl rounded-lg shadow-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-500"
        >
          {isSubmitting ? 'Enviando...' : 'Confirmar Resposta'}
        </Button>
      </motion.div>
    </motion.div>
  );

  const renderResult = () => (
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
          <div className="flex items-center justify-center gap-6 text-2xl font-semibold my-5">
            <span className="text-yellow-400 flex items-center"><Coins className="mr-2 h-8 w-8" /> +{COINS_PER_CORRECT_ANSWER}</span>
            <span className="text-purple-400 flex items-center"><Award className="mr-2 h-8 w-8" /> +{POINTS_PER_CORRECT_ANSWER}</span>
          </div>
        </>
      ) : (
        <>
          <XCircle className="h-24 w-24 text-red-400 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]" />
          <h3 className="text-4xl font-bold text-red-300 mb-3">Incorreto!</h3>
          <p className="text-md text-slate-400 mt-4">A resposta correta era: <strong className="text-green-400">{currentQuestion.options.find(opt => opt.isCorrect)?.text}</strong></p>
        </>
      )}
      <Button
        onClick={handleNext}
        className="mt-10 bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-8 text-lg rounded-lg shadow-lg transition-transform transform hover:scale-105"
      >
        {currentQuestionIndex < questions.length - 1 ? 'Próxima Pergunta' : 'Ver Resultado Final'}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </motion.div>
  );

  const renderFinalScore = () => (
    <motion.div
      key="final-score"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="text-center p-8 bg-card rounded-xl shadow-2xl border border-primary/50"
    >
      <Trophy className="h-24 w-24 text-yellow-400 mx-auto mb-5 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
      <h2 className="text-4xl font-bold text-primary-foreground mb-4">Quiz Finalizado!</h2>
      <p className="text-lg text-muted-foreground mb-6">Confira seu desempenho:</p>
      <div className="grid grid-cols-2 gap-4 text-left text-xl max-w-md mx-auto">
        <div className="bg-slate-800/50 p-4 rounded-lg">
          <p className="text-green-400 font-bold">{score.correct} <span className="text-sm font-normal text-slate-300">Corretas</span></p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-lg">
          <p className="text-red-400 font-bold">{score.incorrect} <span className="text-sm font-normal text-slate-300">Incorretas</span></p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-lg col-span-2">
          <p className="text-yellow-400 font-bold">{score.coins} <span className="text-sm font-normal text-slate-300">Moedas Ganhas</span></p>
        </div>
         <div className="bg-slate-800/50 p-4 rounded-lg col-span-2">
          <p className="text-purple-400 font-bold">{score.points} <span className="text-sm font-normal text-slate-300">Pontos Ganhos</span></p>
        </div>
      </div>
      <Button onClick={onFinish} className="mt-10 btn-primary-dark text-lg py-3 px-8">
        Jogar Novamente
      </Button>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      {quizFinished ? renderFinalScore() : !showResult ? renderQuestion() : renderResult()}
    </AnimatePresence>
  );
};

export default QuestionFlow;
