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
    import { Award, Loader2 } from 'lucide-react';

    const ConfirmPromotionDialog = ({ isOpen, onOpenChange, member, suggestedPatente, onConfirmPromotion, isProcessing }) => {
      if (!member || !suggestedPatente) return null;

      return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Promoção</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja promover o membro <span className="font-semibold text-primary">{member.codinome}</span> para <span className="font-semibold text-primary">{suggestedPatente}</span>?
                Esta ação atualizará o status da promoção e a patente atual do membro.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="outline" className="btn-secondary-dark" disabled={isProcessing}>Cancelar</Button>
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => onConfirmPromotion(member, suggestedPatente)} className="btn-success-dark" disabled={isProcessing}>
                 {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Award className="mr-2 h-4 w-4" />} Confirmar Promoção
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    };
    export default ConfirmPromotionDialog;