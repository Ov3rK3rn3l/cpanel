
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ResultView from './ResultView';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const COINS_PER_PATENTE_GROUP = {
  DEFAULT: 2, RESERVISTA: 5, RECRUTA: 8, "Sd 2ª Classe": 10, "Sd 1ª Classe": 10, CABO: 15,
  "3º Sgt": 25, "2º Sgt": 27, "1º Sgt": 29, SUBTENENTE: 35,
  "Aluno-Oficial": 50, "Aspirante a Oficial": 50, "2º Tenente": 60, "1º Tenente": 65, CAPITAO: 80,
};
const POINTS_PER_CORRECT_ANSWER = 10;

const getCoinsForPatente = (patenteAtual) => {
  return COINS_PER_PATENTE_GROUP[patenteAtual] || COINS_PER_PATENTE_GROUP.DEFAULT;
};

const QuestionView = ({ question, memberData, setMemberData, onComplete }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSelect = (index) => {
    if (showResult || isSubmitting) return;
    setSelectedOptionIndex(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedOptionIndex === null) return;
    setIsSubmitting(true);

    const selectedOpt = question.options[selectedOptionIndex];
    const correct = selectedOpt.isCorrect;
    setIsCorrect(correct);

    let earnedCoins = 0;
    let earnedPoints = 0;
    if (correct) {
      earnedCoins = getCoinsForPatente(memberData.patente_atual);
      earnedPoints = POINTS_PER_CORRECT_ANSWER;
    }
    setCoinsEarned(earnedCoins);
    setPointsEarned(earnedPoints);

    try {
      await supabase.from('quiz_attempts').insert({
        member_id: memberData.id,
        question_id: question.id,
        selected_option_index: selectedOptionIndex,
        is_correct: correct,
        coins_earned: earnedCoins,
        patente_at_attempt: memberData.patente_atual,
      });

      if (earnedCoins > 0) {
        await supabase.rpc('increment_member_coins', {
          member_id_param: memberData.id,
          coins_to_add: earnedCoins
        });
        setMemberData(prev => ({ ...prev, coins: (prev.coins || 0) + earnedCoins }));
      }

      if (earnedPoints > 0) {
        await supabase.rpc('increment_member_points', {
          p_member_id: memberData.id,
          p_points_to_add: earnedPoints
        });
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
          <h2 className="text-2xl font-semibold text-slate-100 mb-6 text-center leading-tight">{question.question_text}</h2>
          <div className="space-y-4">
            {question.options.map((option, index) => (
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
      ) : (
        <ResultView
          isCorrect={isCorrect}
          coinsEarned={coinsEarned}
          pointsEarned={pointsEarned}
          correctAnswer={question.options.find(opt => opt.isCorrect)?.text}
          onFinish={onComplete}
        />
      )}
    </AnimatePresence>
  );
};

export default QuestionView;
