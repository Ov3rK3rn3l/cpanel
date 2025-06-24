import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Coins } from 'lucide-react';

const ChallengesCard = () => {
  return (
    <Card className="glassmorphic border-primary/30">
      <CardHeader>
        <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
          <Brain className="mr-2 h-6 w-6 text-primary"/> Desafios e Treinamento
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Participe de atividades para ganhar moedas e aprimorar seus conhecimentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6">
        <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-light text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-primary/40 transition-all transform hover:scale-105">
          <Link to="/quiz">
            <Coins className="mr-2 h-5 w-5"/> Iniciar Quiz G.E.R.R
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          Responda perguntas e acumule moedas!
        </p>
      </CardContent>
    </Card>
  );
};

export default ChallengesCard;