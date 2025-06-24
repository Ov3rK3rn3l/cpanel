import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { formatDate } from '@/components/admin/members/utils';

const WarningsHistoryCard = ({ advertencias }) => {
  const totalAdvertencias = advertencias ? advertencias.length : 0;
  
  if (totalAdvertencias === 0) {
    return null;
  }

  return (
    <Card className="glassmorphic border-destructive/40 h-full">
      <CardHeader>
        <CardTitle className="text-xl text-destructive flex items-center"><ShieldAlert className="mr-2 h-6 w-6"/> Histórico de Advertências ({totalAdvertencias})</CardTitle>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto">
        <ul className="space-y-4">
          {advertencias.map((adv, index) => (
            <li key={index} className="p-4 bg-card/80 rounded-lg border border-destructive/30 shadow-md">
              <div className="flex justify-between items-start mb-1">
                <span className={`text-lg font-semibold ${adv.tipo === "Nivel 2" ? "text-red-400" : adv.tipo === "Nivel 1" ? "text-orange-400" : "text-yellow-500"}`}>
                  {adv.tipo}
                </span>
                <span className="text-xs text-muted-foreground pt-1">{formatDate(adv.data, 'dd/MM/yyyy')}</span>
              </div>
              <p className="text-sm text-foreground/90"><strong>Motivo:</strong> {adv.motivo}</p>
              {adv.observacoes && <p className="text-xs text-muted-foreground mt-1"><strong>Obs:</strong> {adv.observacoes}</p>}
              {adv.aplicada_por_discord_tag && <p className="text-xs text-muted-foreground mt-1"><strong>Aplicada por:</strong> {adv.aplicada_por_discord_tag}</p>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default WarningsHistoryCard;