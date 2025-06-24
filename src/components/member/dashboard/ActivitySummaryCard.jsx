import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { formatDate, YES_NO_OPTIONS_VALUES } from '@/components/admin/members/utils';

const ActivitySummaryCard = ({ memberData }) => {
  const joinDate = memberData.data_ingresso ? formatDate(memberData.data_ingresso) : "N/A";
  const lastPresenceDate = memberData.ultima_presenca ? formatDate(memberData.ultima_presenca) : "Nenhuma";

  return (
    <Card className="glassmorphic border-primary/30 h-full">
      <CardHeader>
        <CardTitle className="text-xl text-primary-foreground/90 flex items-center"><Activity className="mr-2 h-6 w-6 text-primary"/>Resumo de Atividade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Jogo Principal:</span>
          <span className="font-medium text-primary-foreground">{memberData.jogo_principal || 'N/D'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Data de Ingresso:</span>
          <span className="font-medium text-primary-foreground">{joinDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Última Presença:</span>
          <span className="font-medium text-primary-foreground">{lastPresenceDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status ESA:</span>
          <span className="font-medium text-primary-foreground">{memberData.esa === YES_NO_OPTIONS_VALUES.SIM ? "Concluído" : memberData.esa === YES_NO_OPTIONS_VALUES.NAO ? "Não Concluído" : "Não Definido"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status CFO:</span>
          <span className="font-medium text-primary-foreground">{memberData.cfo === YES_NO_OPTIONS_VALUES.SIM ? "Concluído" : memberData.cfo === YES_NO_OPTIONS_VALUES.NAO ? "Não Concluído" : "Não Definido"}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivitySummaryCard;