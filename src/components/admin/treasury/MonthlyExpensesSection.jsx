import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TrendingDown, FileText, Edit3 } from 'lucide-react';

const MonthlyExpensesSection = ({ monthlyExpenses, onTogglePaidStatus, onEditTransaction, onOpenProofModal }) => {
  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-border/30">
      <CardHeader>
        <CardTitle className="text-xl flex items-center text-primary-foreground/90"><TrendingDown className="mr-2 h-6 w-6 text-primary"/> Despesas Mensais Recorrentes</CardTitle>
        <CardDescription className="text-muted-foreground">Marque as despesas conforme são pagas. Comprovantes podem ser adicionados ao editar a transação.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {monthlyExpenses.map((month) => (
          <div key={month.date.toISOString()} className="p-3 border border-border/20 rounded-lg bg-background/20">
            <h4 className="font-semibold text-lg mb-2 text-primary-foreground/80">{month.displayDate} - Pagamentos</h4>
            {month.items.length > 0 ? month.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-border/10 last:border-b-0">
                <div className="flex items-center">
                  <Checkbox
                    id={`paid-${item.id}`}
                    checked={item.is_paid}
                    onCheckedChange={() => onTogglePaidStatus(item, month.date)}
                    className="mr-3 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor={`paid-${item.id}`} className="text-sm cursor-pointer text-foreground/80">
                    {item.name} - R$ {Math.abs(item.amount).toFixed(2)}
                    {item.proof_url && <FileText className="inline ml-2 h-4 w-4 text-blue-400 cursor-pointer" onClick={() => onOpenProofModal(item.proof_url)} title="Ver comprovante"/>}
                  </Label>
                </div>
                 {!item.isRecurringPlaceholder && (
                   <Button variant="ghost" size="sm" onClick={() => onEditTransaction(item)} title="Editar/Adicionar Comprovante">
                      <Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary"/>
                   </Button>
                 )}
              </div>
            )) : <p className="text-sm text-muted-foreground">Nenhuma despesa recorrente configurada para este mês.</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MonthlyExpensesSection;