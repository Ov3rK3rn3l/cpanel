import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ProofViewerDialog = ({ isOpen, onOpenChange, proofUrl }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary">Visualizar Comprovante</DialogTitle>
        </DialogHeader>
        {proofUrl ? (
          <div className="my-4 max-h-[70vh] overflow-auto">
            {proofUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe src={proofUrl} className="w-full h-[60vh]" title="Comprovante PDF"></iframe>
            ) : (
              <img src={proofUrl} alt="Comprovante" className="max-w-full h-auto rounded-md" />
            )}
          </div>
        ) : <p className="text-muted-foreground">Nenhum comprovante para exibir.</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="btn-secondary-dark">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProofViewerDialog;