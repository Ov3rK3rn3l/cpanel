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
    } from "@/components/ui/alert-dialog";
    import { Button } from '@/components/ui/button';
    import { Loader2 } from 'lucide-react';

    const DeleteUserDialog = ({ isOpen, onOpenChange, userEmail, onConfirmDelete, isLoading }) => {
      return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o usuário <strong className="text-primary">{userEmail}</strong> e sua conta de autenticação? 
                Esta ação é irreversível e também removerá o vínculo com qualquer perfil de membro associado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirmDelete} disabled={isLoading} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    };

    export default DeleteUserDialog;