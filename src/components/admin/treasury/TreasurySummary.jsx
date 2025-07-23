import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const TreasurySummary = ({ clanBalance, totalIncome, totalExpenses }) => {
  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-border/30">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center text-primary-foreground/90">
          <DollarSign className="mr-2 h-7 w-7 text-primary"/> Resumo da Tesouraria
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-background/30 rounded-lg text-center border border-border/20">
          <p className="text-sm text-muted-foreground">Saldo Atual do Clã</p>
          <p className={`text-3xl font-bold ${clanBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            R$ {clanBalance.toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-background/30 rounded-lg text-center border border-border/20">
          <p className="text-sm text-muted-foreground">Total de Receitas (Exclui VIPs)</p>
          <p className="text-2xl font-bold text-green-400">R$ {totalIncome.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-background/30 rounded-lg text-center border border-border/20">
          <p className="text-sm text-muted-foreground">Total de Despesas Pagas</p>
          <p className="text-2xl font-bold text-red-400">R$ {Math.abs(totalExpenses).toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreasurySummary;