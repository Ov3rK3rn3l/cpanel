import React, { useState, useEffect } from 'react';
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
    } from '@/components/ui/alert-dialog';
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label';
    import { Input } from '@/components/ui/input';
    import { Textarea } from '@/components/ui/textarea';
    import { Loader2, UserX as UserXIcon } from 'lucide-react';

    const MarkAsLeftDialog = ({ isOpen, onOpenChange, member, onConfirm, isProcessing }) => {
      const [dataSaida, setDataSaida] = useState('');
      const [observacoesSaida, setObservacoesSaida] = useState('');

      useEffect(() => {
        if (member) {
          setDataSaida(member.data_saida || new Date().toISOString().split('T')[0]);
          setObservacoesSaida(member.observacoes_saida || '');
        } else {
          setDataSaida(new Date().toISOString().split('T')[0]);
          setObservacoesSaida('');
        }
      }, [member, isOpen]);

      const handleConfirm = () => {
        if (member) {
          onConfirm(member, dataSaida, observacoesSaida);
        }
      };

      if (!member) return null;

      return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
          <AlertDialogContent className="bg-card border-primary/50 glassmorphic">
            <AlertDialogHeader>
              <AlertDialogTitle>Registrar Saída de {member.codinome || member.discord_nick}</AlertDialogTitle>
              <AlertDialogDescription>
                Confirme os detalhes da saída do membro. Esta ação o marcará como inativo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="data_saida" className="text-muted-foreground">Data de Saída</Label>
                <Input
                  id="data_saida"
                  type="date"
                  value={dataSaida}
                  onChange={(e) => setDataSaida(e.target.value)}
                  className="input-dark mt-1"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <Label htmlFor="observacoes_saida" className="text-muted-foreground">Observações da Saída</Label>
                <Textarea
                  id="observacoes_saida"
                  value={observacoesSaida}
                  onChange={(e) => setObservacoesSaida(e.target.value)}
                  placeholder="Motivo da saída, feedback, etc."
                  className="input-dark mt-1 min-h-[100px]"
                  disabled={isProcessing}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => onOpenChange(false)} className="btn-secondary-dark" disabled={isProcessing}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm} className="btn-destructive-dark" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserXIcon className="mr-2 h-4 w-4" />} 
                Registrar Saída
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    };

    export default MarkAsLeftDialog;