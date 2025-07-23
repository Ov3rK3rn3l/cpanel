import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Coins, Award } from 'lucide-react';

const ResultView = ({ isCorrect, coinsEarned, pointsEarned, correctAnswer, onFinish }) => {
  return (
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
          <div className="flex items-center justify-center text-2xl text-purple-400 font-semibold my-5">
            <Award className="mr-2 h-8 w-8" /> +{pointsEarned} Pontos
          </div>
        </>
      ) : (
        <>
          <XCircle className="h-24 w-24 text-red-400 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]" />
          <h3 className="text-4xl font-bold text-red-300 mb-3">Incorreto!</h3>
          <p className="text-xl text-slate-200 mb-2">Mais sorte na próxima vez. Continue estudando!</p>
          {correctAnswer && (
             <p className="text-md text-slate-400 mt-4">A resposta correta era: <strong className="text-green-400">{correctAnswer}</strong></p>
          )}
        </>
      )}
      <Button
        onClick={onFinish}
        className="mt-10 bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-8 text-lg rounded-lg shadow-lg transition-transform transform hover:scale-105"
      >
        Finalizar Quiz
      </Button>
    </motion.div>
  );
};

export default ResultView;