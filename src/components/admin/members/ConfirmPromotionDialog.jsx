import React from 'react';
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
import { Award, Crown, Loader2 } from 'lucide-react';

const ConfirmPromotionDialog = ({ isOpen, onOpenChange, member, suggestedPatente, onConfirmPromotion, isProcessing, isMeritPromotion }) => {
  if (!member || !suggestedPatente) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Promoção {isMeritPromotion ? "por Mérito" : ""}</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem certeza que deseja promover o membro <span className="font-semibold text-primary">{member.codinome}</span> para a patente de <span className="font-semibold text-primary">{suggestedPatente}</span>?
            <br />
            Esta ação é irreversível e atualizará a patente do membro.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" className="btn-secondary-dark" disabled={isProcessing}>Cancelar</Button>
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirmPromotion} 
            className={isMeritPromotion ? 'btn-merit-dark' : 'btn-success-dark'} 
            disabled={isProcessing}
          >
             {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (isMeritPromotion ? <Crown className="mr-2 h-4 w-4"/> : <Award className="mr-2 h-4 w-4" />)} 
             Confirmar Promoção
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default ConfirmPromotionDialog;