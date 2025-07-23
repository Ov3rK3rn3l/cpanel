
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronsUp, AlertTriangle, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import ProgressChart from '@/components/member/ProgressChart';

const CareerProgressCard = ({ nextPatenteInfo, memberData, courseAlertMessage, presencasData }) => {
  const isMeritPromotion = nextPatenteInfo.nextPatente === "Promoção por Mérito";

  return (
    <Card className="glassmorphic border-primary/40 hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center text-primary-foreground/90"><ChevronsUp className="mr-3 h-7 w-7 text-primary"/>Progresso de Carreira</CardTitle>
        <CardDescription className="text-muted-foreground">
          {nextPatenteInfo.nextPatente === "Patente Máxima" 
            ? "Você alcançou a patente máxima! Parabéns!"
            : `Sua próxima meta: ${nextPatenteInfo.nextPatente}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {nextPatenteInfo.nextPatente !== "Patente Máxima" ? (
          <>
            <div className="relative w-full h-8 bg-slate-700/50 rounded-full overflow-hidden mb-2 shadow-inner">
              <motion.div 
                className={`absolute top-0 left-0 h-full ${isMeritPromotion ? 'bg-gradient-to-r from-purple-500 to-purple-700' : 'bg-gradient-to-r from-red-500 to-red-700'}`}
                initial={{ width: 0 }}
                animate={{ width: `${nextPatenteInfo.progressPercentage}%` }}
                transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                {isMeritPromotion ? "Mérito" : `${Math.round(nextPatenteInfo.progressPercentage)}%`}
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-3">
              <span>{memberData.total_presencas || 0} Presenças Atuais</span>
              {!isMeritPromotion && (
                <span>
                  {nextPatenteInfo.presencesNeeded > 0 
                    ? `${nextPatenteInfo.presencesNeeded} para ${nextPatenteInfo.nextPatente} (${nextPatenteInfo.nextPatentePresences} total)`
                    : `Requisitos para ${nextPatenteInfo.nextPatente} atingidos!`}
                </span>
              )}
            </div>
            {courseAlertMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className={`mt-4 p-3 rounded-md text-sm flex items-start ${courseAlertMessage.type === 'cfo' ? 'bg-blue-900/70 border-blue-500/80 text-blue-200' : 'bg-orange-900/70 border-orange-500/80 text-orange-200'} border`}
              >
                <AlertTriangle className={`mr-2 h-5 w-5 flex-shrink-0 ${courseAlertMessage.type === 'cfo' ? 'text-blue-400' : 'text-orange-400'}`} />
                <p>{courseAlertMessage.text}</p>
              </motion.div>
            )}
            <ProgressChart presencasData={presencasData} />
          </>
        ) : (
           <div className="text-center py-8">
              <Award className="h-16 w-16 text-yellow-400 mx-auto mb-3 drop-shadow-lg" />
              <p className="text-2xl font-semibold text-yellow-400">Patente Máxima Atingida!</p>
              <p className="text-muted-foreground">Seu serviço e dedicação são exemplares.</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CareerProgressCard;
